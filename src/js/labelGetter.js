export {getLabel};

const replaceFunc = {
    Literal: getLabelLiteral,
    Identifier: getLabelIdentifier,
    UpdateExpression: getLabelUpdateExpression,
    ArrayExpression: getLabelArrayExpression,
    BlockStatement: getLabelBlockStatement,
    ExpressionStatement: getLabelExpressionStatement,
    VariableDeclaration: getLabelVariableDeclaration,
    BinaryExpression: getLabelBinaryExpression,
    UnaryExpression: getLabelUnaryExpression,
    MemberExpression: getLabelMemberExpression,
    ReturnStatement: getLabelReturnStatement,
    AssignmentExpression: getLabelAssignmentExpression,
    IfStatement: getLabelIfStatement,
    WhileStatement: getLabelWhileStatement
};

function getLabelBlockStatement(code){
    let res = '';
    for(let i=0;i<code.body.length;i++){
        res += getLabel(code.body[i])+'\n';
    }
    return res;
}

function getLabelArrayExpression(code){
    let res = [];
    for(let i=0;i<code.elements.length;i++){
        res.push(getLabel(code.elements[i]));
    }
    return '[' + res.join(', ') + ']';
}

function getLabelExpressionStatement(code){
    return getLabel(code.expression);
}

function getLabelVariableDeclaration(code){
    let arg = code.declarations[0];
    let init = getLabel(arg.init);
    let name = getLabel(arg.id);
    return name + ' = ' + init;
}

function getLabelIdentifier(code){
    return code.name;
}

function getLabelLiteral(code){
    return code.raw;
}

function getLabelUpdateExpression(code){
    let val = getLabel(code.argument);
    return code.prefix ? code.operator + val : val + code.operator;
}
function getLabelMemberExpression(code){
    let name = code.object.name;
    let index = getLabel(code.property);
    return name + '[' + index + ']';
}

function getLabelBinaryExpression(code){
    let left = getLabel(code.left);
    let right = getLabel(code.right);
    return left + ' ' + code.operator + ' ' + right;
}

function getLabelUnaryExpression(code){
    let val = getLabel(code.argument);
    return code.operator + val;
}

function getLabelReturnStatement(code){
    return 'return ' + getLabel(code.argument);
}

function getLabelAssignmentExpression(code){
    return getLabel(code.left) + ' ' + code.operator + ' ' + getLabel(code.right);
}

function getLabelIfStatement(code){
    let test = getLabel(code.test);
    let consequent = getLabel(code.consequent);
    let alternate = getLabel(code.alternate);
    if(alternate !== '')
        alternate = 'else ' + alternate;
    return 'if (' + test + ') {\n' + consequent + '\n} ' + alternate;
}

function getLabelWhileStatement(code){
    let test = getLabel(code.test);
    let body = getLabel(code.body);
    return 'while (' + test + ') {\n' + body + '\n}';
}

function getLabel(exp){
    if (exp === null || exp === undefined) return '';
    let func = replaceFunc[exp.type];
    return func(exp);

}