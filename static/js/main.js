$(window).ready(function() {

  var debug = false;
  var input = $("#calc_tb");
  var bFirstTime = true;
  var $results = $("#results");
  var bWasNumeric = false;
  var bisNumeric = false;

  var functions = ["ln"];

  function isOperand(elem, bAllowParenthesis) {
    elem = $.trim(elem);

    if (bAllowParenthesis && (elem == "(" || elem == ")")) return true;
    return (
      elem == "+" || elem == "-" || elem == "*" || elem == "/" || elem == "^"
    );
  }

  function displayError(msg, data) {
    var h = "";
    if (msg == "mismatched_parenthesis")
      h = " Sus paréntesis no están equilibradas";
    else if (msg == "too_many_decimals")
      h = "Ha introducido un número con muchos decimales";
    else if (msg == "number_parse_problem")
      h = "No se entiende el siguiente término-->" + data;
    else if (msg == "rpn_pop_pop") h = "No se ha podido procesar su expresion";
  
    else if (msg == "division_by_zero")
      h = " Está tratando de dividir por cero!";
    else if (msg == "could_not_parse") h = "No se puede procesar su expresion";
    $("#errmsg").css("display", "block");
    $("#errmsg").html(h);
  }

  function getFullNumber(str) {
    var bFoundDot = false;
    var out = "";
    for (var j = 0; j < str.length; j++) {
      var currLett = str.substring(j, j + 1);

      if ("0123456789".indexOf(currLett) != -1) out += currLett;
      else if ("." == currLett && bFoundDot) {
        displayError("too_many_decimals");
        break;
      } else if ("." == currLett && bFoundDot == false) {
        out += currLett;
        bFoundDot = true;
      } else break;
    }
    return out;
  }

  function toArr(data) {
    var bAllowParenthesis = true;
    var arr = [];
    for (var i = 0; i < data.length; i++) {
      var currLett = data.substring(i, i + 1);
      if (currLett == " ") continue;
      var bisNumeric = currLett == "." || "0123456789".indexOf(currLett) != -1;
      if (bisNumeric) {
        var fullNum = getFullNumber(data.substring(i));
        var isOk = isNaN(+fullNum) == false;
        if (isOk) arr.push(parseFloat(fullNum) + "");
        else displayError("number_parse_problem", fullNum);
        i += fullNum.length - 1;
      } else if (isOperand(currLett, bAllowParenthesis)) arr.push(currLett);
    }


    for (i = arr.length - 1; i >= 0; i--) {
      var token = arr[i];
      if (arr[i] == "-") {
        if (i == 0 && arr.length > 0) {
          arr[0] = "-" + arr[1];
          arr.splice(1, 1);
        }
        else if (
          i + 1 < data.length &&
          i > 0 &&
          isOperand(arr[i - 1], bAllowParenthesis) &&
          "0123456789.".indexOf(arr[i + 1])
        ) {
          arr[i] = "-" + arr[i + 1];
          arr.splice(i + 1, 1);
        }
      }
    }
    return arr;
  }

  function resetErr() {
    $("#errmsg").css("display", "none");
  }

  input.focus(function() {
    if (bFirstTime) input.val("");
    input.css("color", "black");

    bFirstTime = false;
  });

  function p(str) {
    if (debug);
  }

  function infixToPostfix(array) {
    var i,
      operandStack = [];
    var output = [];

    var bAllowParenthesis = true;
    for (i = 0; i < array.length; i++) {
      var currentToken = $.trim(array[i]);
      if (isOperand(currentToken, bAllowParenthesis)) {
        p(
          "I is operand " +
            currentToken +
            ", output : " +
            output +
            ", operandStack: " +
            operandStack
        );
        if (operandStack.length == 0) operandStack.push(currentToken);
        else if (operandStack.length > 0 && currentToken == ")") {
          while (
            operandStack.length > 0 &&
            operandStack[operandStack.length - 1] != "("
          ) {
            output.push(operandStack.pop());
          }
          p(
            "\t B now, pop off " +
              operandStack[operandStack.length - 1] +
              " Coloque paréntesis de cierre!"
          );
          if (operandStack[operandStack.length - 1] != "(") {
            displayError("mismatched_parenthesis");
            return;
          }
          operandStack.pop(); 
        } 
        else if (operandStack.length > 0) {
          p("II is operand " + currentToken + ", output : " + output);
          if (
            (operandStack[operandStack.length - 1] == "(" &&
              currentToken == "(") ||
            (currentToken != "(" &&
              operatorToPrecedence(operandStack[operandStack.length - 1]) >=
                operatorToPrecedence(currentToken))
          ) {
            p(" C  , operandStack : " + operandStack);
            while (
              operandStack.length > 0 &&
              operandStack[operandStack.length - 1] != "(" &&
              operatorToPrecedence(operandStack[operandStack.length - 1]) >=
                operatorToPrecedence(currentToken)
            ) {
              output.push(operandStack.pop());
            }

            p("\t D now, pop off " + operandStack[operandStack.length - 1]);
            operandStack.push(currentToken);
          } else if (
            operatorToPrecedence(operandStack[operandStack.length - 1]) <
            operatorToPrecedence(currentToken)
          ) {
            p(
              "\t III operandStack[operandStack.length-1] ," +
                operandStack[operandStack.length - 1] +
                "< " +
                currentToken
            );
            operandStack.push(currentToken);
          }
        }
      }

      else if (isNaN(+currentToken) == false) {
        p("IV isNumber() currentToken = " + currentToken);
        output.push(currentToken);
      }
    }
    while (operandStack.length > 0) output.push(operandStack.pop());

    return output;
  }

  function operatorToPrecedence(op) {
    if (op == "+" || op == "-") return 1;
    else if (op == "*" || op == "/") return 2;
    else if (op == "^") return 3;
    else if (op == "(" || op == ")") return 4;
    else throw "Unknown operator =" + op + ",at  operatorToPrecedence()";
  }


  function evaluateRPN(rpnArray) {
    var operandsStack = [];
    var r = 0;
    var i = 0;
    var iterationCount = 0;

    while (rpnArray.length > 1) {
      var currentToken = $.trim(rpnArray[i]);

      if (isOperand(currentToken)) {
        var op = rpnArray.splice(i, 1);
        var insertAt = i - 2;
        i--;

        if (rpnArray.length < 2) {
          displayError("rpn_pop_pop");
          return;
        }
        var n1Was = rpnArray.splice(i, 1);
        i--;
        var n2Was = rpnArray.splice(i, 1);

        var n1 = parseFloat(n1Was);
        var n2 = parseFloat(n2Was);
        if (isNaN(+n1)) {
          displayError("could_not_parse");
          return;
        }
        if (isNaN(+n2)) {
          displayError("could_not_parse");
          return;
        }

        var pushMe = calculate(n2, n1, op);
        rpnArray.splice(insertAt, 0, pushMe);
      } else i++;

      if (iterationCount++ > 500) {
        displayError("could_not_parse");
        return;
      }
    }

    if (rpnArray.length != 1) {
      displayError("could_not_parse");
    }
    return rpnArray.pop();
  }

  function calculate(a, b, op) {
    if (op == "+") return a + b;
    else if (op == "-") return a - b;
    else if (op == "*") return a * b;
    else if (op == "^") return Math.pow(a, b);
    else if (op == "/") {
      if (b == 0) {
        displayError("division_by_zero");
        return;
      }
      return a / b;
    }
  }
  function evaluateFuncts() {
    var finalString = "";

    for (var i = 0; i < functions.length; i++) {
      var data = new String($results.text());
      var fxn = functions[i];
      var c = 0;

      var firstRun = true;
      while (data.indexOf(fxn) != -1 && c++ < 5) {
        if (firstRun) {
          p("fxn: " + fxn + ", data : " + data);
          firstRun = false;
        }
        var inject = "inject";
        var iStart = data.indexOf(fxn);
        var temp = data.substring(iStart + fxn.length);
        var iEnd = temp.indexOf(")") + 1;
        var lastPart = temp.substring(iEnd);

        temp = temp.substring(0, iEnd);

        var number = temp.substring(temp.indexOf("(") + 1, temp.indexOf(")"));

        if (isNaN(+number)) number = parseFloat(number);

        if (fxn == "ln") inject = Math.LN10(number);

        var firstPart = data.substring(0, iStart);

        data = firstPart + " " + inject + " " + lastPart;
        $results.text(data);
      }
    }
  }

  $(".tecla").click(function() {
    resetErr();

    bisNumeric = false;

    var val = $(this).val();
    var inject = "";

    if ($.inArray(val, functions) != -1) {
      inject = (bWasNumeric ? " * " : "") + val + "(";
    } else if (val == "del") {
      {
        var data = new String($results.text());
        if (data.length == 0) return;
        else if (data.length == 1 && data == " ") return;

        var lastLttr = data.substring(data.length - 1);
        if (lastLttr == " ") data = data.substring(0, data.length - 2);
        else data = data.substring(0, data.length - 1);

        $results.html(data);
        return;
      }
    } else if (val == "C") {
      $results.html("");
      return;
    } else if (val == "pareni") inject = "(";
    else if (val == "parend") inject = ")";
    else if (val == "=") {
      evaluateFuncts();

      var arr = toArr($results.text());
      arr = infixToPostfix(arr);
      var theResult = evaluateRPN(arr);
      $results.html(theResult);
      return;
    } else {
      if (isNaN(+val) == false || val == ".") bisNumeric = true;
      inject = val;
    }

    var space = bWasNumeric && bisNumeric ? "" : " ";
    $results.html($results.html() + space + inject);

    bWasNumeric = bisNumeric;
  });

  $("#clear").click(function() {
    input.val("");
  });
});
