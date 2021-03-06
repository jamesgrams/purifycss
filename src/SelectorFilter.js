import { getAllWordsInSelector } from "./utils/ExtractWordsUtil"

const isWildcardWhitelistSelector = selector => {
    return selector[0] === "*" && selector[selector.length - 1] === "*"
}

const isRegexWhitelistSelector = selector => {
    return selector[0] === "/"
}

const hasWhitelistMatch = (selector, whitelist) => {
    for (let el of whitelist) {
        if(el instanceof RegExp) {
            if (selector.match(el)) return true
        }
        else if (selector.includes(el)) return true
    }
    return false
}

class SelectorFilter {
    constructor(contentWords, whitelist, blacklist) {
        this.contentWords = contentWords
        this.rejectedSelectors = []
        this.patternWhitelist = []
        this.patternBlacklist = []
        this.parseWhitelist(blacklist, this.patternBlacklist)
        this.parseWhitelist(whitelist, this.patternWhitelist)
    }

    initialize(CssSyntaxTree) {
        CssSyntaxTree.on("readRule", this.parseRule.bind(this))
    }

    parseWhitelist(whitelist, patternList) {
        whitelist.forEach(whitelistSelector => {
            if (isWildcardWhitelistSelector(whitelistSelector)) {
                // If '*button*' then push 'button' onto list.
                patternList.push(
                    whitelistSelector.substr(1, whitelistSelector.length - 2)
                )
            }
            else if (isRegexWhitelistSelector(whitelistSelector)) {
                let regexParser = /^\/(.*)\/(.*)$/
                let groups = whitelistSelector.match( regexParser )
                let regex = new RegExp( groups[1], groups[2] )
                patternList.push(regex)
            } else {
                getAllWordsInSelector(whitelistSelector).forEach(word => {
                    this.contentWords[word] = true
                })
            }
        })
    }

    parseRule(selectors, rule) {
        rule.selectors = this.filterSelectors(selectors)
    }

    filterSelectors(selectors) {
        let contentWords = this.contentWords,
            rejectedSelectors = this.rejectedSelectors,
            patternWhitelist = this.patternWhitelist,
            patternBlacklist = this.patternBlacklist,
            usedSelectors = []

        selectors.forEach(selector => {
            if (hasWhitelistMatch(selector, patternWhitelist)) {
                usedSelectors.push(selector)
                return
            }
            if(hasWhitelistMatch(selector, patternBlacklist)) {
                rejectedSelectors.push(selector)
                return
            }
            let words = getAllWordsInSelector(selector),
                usedWords = words.filter(word => contentWords[word])

            if (usedWords.length === words.length) {
                usedSelectors.push(selector)
            } else {
                rejectedSelectors.push(selector)
            }
        })

        return usedSelectors
    }
}

export default SelectorFilter
