'use strict';

var { mathjax } = require('mathjax-full/js/mathjax');
var { AsciiMath } = require('mathjax-full/js/input/asciimath');
var { SVG } = require('mathjax-full/js/output/svg');
var { RegisterHTMLHandler } = require('mathjax-full/js/handlers/html');
var { liteAdaptor } = require('mathjax-full/js/adaptors/liteAdaptor');

const adaptor = liteAdaptor();
const handler = RegisterHTMLHandler(adaptor);
const ascii = new AsciiMath();
const svg = new SVG();
const html = mathjax.document('', {InputJax: ascii, OutputJax: svg});

const vscode = require('vscode');
const mathTemplateSnippet = new vscode.SnippetString('<img src="https://math.justforfun.click/$/$0"/>');

const imgSrcRex = /<img .*\bsrc\s*=\s*["']https:\/\/math\.justforfun\.click\/\$\/([^"']*)["'][ \/>]/s;
const imgStyleRex = /<img .*\bstyle\s*=\s*["']([^'"]*)["'][ \/>]/s;

function render(md, options) {
    md.renderer.rules.html_block = md.renderer.rules.html_inline = (tokens, idx, options, env, self) => {
        var token = tokens[idx];
        var content = token.content;
        var imgSrcMatches = content.match(imgSrcRex);
        if (imgSrcMatches) {
            var mathContent = imgSrcMatches[1];
            var svgContent = adaptor.innerHTML(html.convert(mathContent));
            var imgStyleMatches = content.match(imgStyleRex);
            if (imgStyleMatches) {
                var styleContent = imgStyleMatches[1];
                if (styleContent.indexOf("width:") >= 0 || styleContent.indexOf("height:") >= 0) {
                    svgContent = svgContent.replace(/width="[^"]*"/, "");
                    svgContent = svgContent.replace(/height="[^"]*"/, "");
                }
                var styleStr = ' style="';
                var stylePos = svgContent.indexOf(styleStr);
                stylePos = svgContent.indexOf('"', stylePos + styleStr.length);
                svgContent = svgContent.substring(0, stylePos) + ";" + styleContent + svgContent.substring(stylePos);
            }
            return svgContent;
        }
        return content;
    };
}

exports.activate = function activate(context) {
    vscode.commands.registerCommand('math-to-svg.insert-math', () => {
        var editor = vscode.window.activeTextEditor;
        editor.insertSnippet(mathTemplateSnippet);
    });

    return {
        extendMarkdownIt: function (md) {
            return md.use(render);
        }
    };
};