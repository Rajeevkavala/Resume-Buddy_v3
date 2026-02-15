export function latexEscape(input) {
    // Minimal LaTeX escaping for common special chars.
    // Keep this conservative: better to escape too much than too little.
    return input
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/\$/g, '\\$')
        .replace(/&/g, '\\&')
        .replace(/#/g, '\\#')
        .replace(/_/g, '\\_')
        .replace(/%/g, '\\%')
        .replace(/\^/g, '\\textasciicircum{}')
        .replace(/~/g, '\\textasciitilde{}');
}
