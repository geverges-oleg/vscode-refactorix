import * as fs from 'fs';
import * as ts from 'typescript';

import {ParseDiagnostics, singleStatementBlockToExpressions} from '../src/core';

export function writeChanges(sourceFile: ts.SourceFile, changes: ts.TextChange[]): string {
    let result = sourceFile.getFullText();
    for (let i = changes.length - 1; i >= 0; i--) {
        const change = changes[i];
        const head = result.slice(0, change.span.start);
        const tail = result.slice(change.span.start + change.span.length);
        result = head + change.newText + tail;
    }
    return result;
}

describe('parseDiagnostics', () => {
    it('should have errors', () => {
        const noTs: ParseDiagnostics = <any>ts.createSourceFile('x.ts', 'this is no ts', ts.ScriptTarget.Latest, true);
        expect(noTs.parseDiagnostics.length).toBe(3);
    });
});

describe('arrow-function-spec-data.ts', () => {

    const fileName = './spec/arrow-function-spec-data.ts';
    const content = fs.readFileSync(fileName).toString();
    const sourceFile = ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true);

    it('content eq', () => {
        expect(content).toEqual(sourceFile.getFullText());
    });

    describe('singleStatementBlockToExpression', () => {

        const changes = singleStatementBlockToExpressions(sourceFile);

        it('should find changes', () => {
            expect(changes.changes.length).toBe(5); // -1 for an overlap
            expect(changes.overlaps).toBeTruthy();
        });

        it('should write changes', () => {
            const newText = writeChanges(sourceFile, changes.changes);
            // fs.writeFileSync('./spec/arrow-function-spec-data.ts-rewritten.ts', newText);
            const newSource: ParseDiagnostics = <any>ts.createSourceFile(fileName, newText, ts.ScriptTarget.Latest, true);
            if (newSource.parseDiagnostics.length > 0) {
                // console.error(`error while reparsing ${newText}`);
                newSource.parseDiagnostics.forEach(err => console.error(`parseDiagnostics: ${err.messageText}`));
            }
            expect(newSource.parseDiagnostics.length).toBe(0);
        });
    });
});


