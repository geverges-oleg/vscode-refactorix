import { singleStatementBlockToExpressions, expressionToBlock as coreExpressionToBlock } from './core';
import { getIndentAtLine, getTabs, changeToRange, selectionToSpan, createSourceFileFromActiveEditor } from './refactor';

export function toggleSingleStatementBlockExpression() {
    if (!expressionToBlock()) {
        singleStatementBlockToExpression(false);
    }
}

export function expressionToBlock(): boolean {
    const source = createSourceFileFromActiveEditor();
    if (!source) {
        return false;
    }
    const editor = source.editor;
    const { document, selection } = editor;

    const change = coreExpressionToBlock(source.sourceFile, selectionToSpan(document, selection), getIndentAtLine(document, selection.start.line), getTabs(editor, 1));
    if (!change) {
        return false;
    }

    editor.edit(builder => builder.replace(changeToRange(document, change), change.newText))
        .then(ok => {
            if (ok) {
                editor.selection = selection;
            }
        });

    return true;
}

export function singleStatementBlockToExpression(replaceAll: boolean) {
    let overlapRecursionsLeft = 10;

    (function doIt() {
        const source = createSourceFileFromActiveEditor();
        if (!source) {
            return;
        }
        const editor = source.editor;
        const { document, selection } = editor;

        const all = singleStatementBlockToExpressions(source.sourceFile, replaceAll ? undefined : selectionToSpan(document, selection));
        if (all.changes.length === 0) {
            return;
        }

        if (!replaceAll) {
            all.changes = [all.changes[0]];
        }

        editor.edit(builder =>
            all.changes.forEach(change => builder.replace(changeToRange(document, change), change.newText)))
            .then(ok => {
                if (ok) {
                    editor.selection = selection;
                    if (replaceAll && all.changes.length > 1 && all.overlaps && overlapRecursionsLeft > 0) {
                        doIt();
                        overlapRecursionsLeft--;
                    }
                }
            });
    })();
}
