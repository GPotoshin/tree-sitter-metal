import XCTest
import SwiftTreeSitter
import TreeSitterMetal

final class TreeSitterMetalTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_metal())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Metal grammar")
    }
}
