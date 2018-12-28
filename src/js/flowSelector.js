export {getFlow};

const replaceFunc = {
    Identifier: getFlowInIdentifier,
    ArrayExpression: getFlowInArrayExpression,
    BlockStatement: getFlowInBlockStatement,
    ExpressionStatement: getFlowInExpressionStatement,
    VariableDeclaration: getFlowInVariableDeclaration,
    BinaryExpression: getFlowInBinaryExpression,
    UnaryExpression: getFlowInUnaryExpression,
    MemberExpression: getFlowInMemberExpression,
    ReturnStatement: getFlowInReturnStatement,
    AssignmentExpression: getFlowInAssignmentExpression,
    IfStatement: getFlowInIfStatement,
    WhileStatement: getFlowInWhileStatement
};

function getFlowInBlockStatement(node, vars){
    let code = node.astNode;
    for(let i=0;i<code.body.length;i++){
        code.body[i] = getFlow(node.body[i], vars);
        if(node.body[i] == null) delete code.body[i];
    }
    code.body = code.body.filter(value => Object.keys(value).length !== 0);
    return code;
}

function getFlowInArrayExpression(node, vars){
    let code = node.astNode;
    for(let i=0;i<code.elements.length;i++){
        code.elements[i] = getFlow(node.elements[i], vars);
    }
    return code;
}

function getFlowInExpressionStatement(node, vars){
    let code = node.astNode;
    code.expression = getFlow(node.expression,vars);
    if(node.expression == null) {delete code.expression; return null;}
    return code;
}

function getFlowInVariableDeclaration(node, vars){
    let code = node.astNode;
    let arg = code.declarations[0];
    arg.init = getFlow(arg.init,vars);
    vars[arg.id.name] = arg.init;
    return null;
}

function getFlowInIdentifier(node, vars){
    let code = node.astNode;
    if(node.name in vars){
        code = vars[code.name];
    }
    return code;
}

function getFlowInMemberExpression(node, vars){
    let code = node.astNode;
    let name = code.object.name;
    if(name in vars){
        code = vars[name].elements[code.property.value];
    }
    return code;
}

function getFlowInBinaryExpression(node, vars){
    let code = node.astNode;
    code.left = getFlow(node.left, vars);
    code.right = getFlow(node.right, vars);
    return calculate(node);
}

function getFlowInUnaryExpression(node, vars){
    let code = node.astNode;
    code.argument = getFlow(node.argument, vars);
    return code;
}

function getFlowInReturnStatement(node, vars){
    let code = node.astNode;
    if(node.argument != null)
        code.argument = getFlow(node.argument, vars);
    return code;
}

function getFlowInAssignmentExpression(node, vars){
    let code = node.astNode;
    code.right = getFlow(node.right,vars);
    let arg = code.left;
    if(getName(arg) in vars) {
        if (arg.type === 'Identifier')
            vars[arg.name] = code.right;
        else
            vars[arg.object.name].elements[arg.property.value] = code.right;
        return null;
    }
    else if (arg.type === 'MemberExpression')
        arg.property = getFlow(arg.property,vars);
    return code;
}

function getFlowInIfStatement(node, vars){
    let code = node.astNode;
    let varsCopy = {};
    for (let i in vars)
        varsCopy[i] = vars[i];
    code.test = getFlow(node.test,vars);
    code.consequent = getFlow(node.consequent,varsCopy);
    if(node.alternate != null)
        code.alternate = getFlow(node.alternate,vars);
    return code;
}

function getFlowInWhileStatement(node, vars){
    let code = node.astNode;
    let varsCopy = {};
    for (let i in vars)
        varsCopy[i] = vars[i];
    code.test = getFlow(node.test,vars);
    code.body = getFlow(node.body,varsCopy);
    return code;
}

function getFlow(cfg, vars){
    cfg['color'] = 'green';
    if (cfg === null || cfg === undefined) return '';
    let func = replaceFunc[cfg.astNode.type];
    func(cfg,vars);
    return cfg;

}

function getName(exp){
    switch(exp.type){
    case 'Identifier':
        return exp.name;
    default:
        return exp.object.name;
    }
}

function calculate(binexp){
    if(binexp.left.type === 'BinaryExpression') binexp.left = calculate(binexp.left);
    if(binexp.right.type === 'BinaryExpression') binexp.right = calculate(binexp.right);
    if(binexp.left.type === 'Literal' && binexp.right.type === 'Literal')
        return calcBothLit(binexp);
    return binexp;
}

function calcBothLit(binexp){
    let left = binexp.left; let right = binexp.right; let op = binexp.operator;
    let val = eval(left.raw + ' ' + op + ' ' + right.raw);
    return {'type': 'Literal', 'value': val, 'raw': val.toString()};
}