import { useEffect, useState } from "react";

const HISTORY_STORAGE_KEY = "basic-calculator-history";

const buttons = [
  { label: "C", action: "clear", kind: "muted" },
  { label: "DEL", action: "delete", kind: "muted" },
  { label: "/", action: "operator", value: "/", kind: "accent" },
  { label: "*", action: "operator", value: "*", kind: "accent" },
  { label: "7", action: "digit" },
  { label: "8", action: "digit" },
  { label: "9", action: "digit" },
  { label: "-", action: "operator", value: "-", kind: "accent" },
  { label: "4", action: "digit" },
  { label: "5", action: "digit" },
  { label: "6", action: "digit" },
  { label: "+", action: "operator", value: "+", kind: "accent" },
  { label: "1", action: "digit" },
  { label: "2", action: "digit" },
  { label: "3", action: "digit" },
  { label: "=", action: "equals", kind: "primary", className: "button-tall" },
  { label: "0", action: "digit", className: "button-wide" },
  { label: ".", action: "decimal" },
];

const formatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 12,
});

function calculate(left, right, operator) {
  const first = Number(left);
  const second = Number(right);

  if (Number.isNaN(first) || Number.isNaN(second)) {
    return "Error";
  }

  switch (operator) {
    case "+":
      return String(first + second);
    case "-":
      return String(first - second);
    case "*":
      return String(first * second);
    case "/":
      return second === 0 ? "Error" : String(first / second);
    default:
      return right;
  }
}

function formatDisplay(value) {
  if (!value || value === "Error") {
    return value || "0";
  }

  const [whole, decimal] = value.split(".");
  const formattedWhole = whole ? formatter.format(Number(whole)) : "0";

  if (decimal === undefined) {
    return formattedWhole;
  }

  return `${formattedWhole}.${decimal}`;
}

function isHistoryEntry(entry) {
  return (
    entry &&
    typeof entry === "object" &&
    typeof entry.id === "string" &&
    typeof entry.left === "string" &&
    typeof entry.right === "string" &&
    typeof entry.operator === "string" &&
    typeof entry.result === "string"
  );
}

function getStoredHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedValue = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    return Array.isArray(parsedValue) ? parsedValue.filter(isHistoryEntry) : [];
  } catch {
    return [];
  }
}

function formatHistoryExpression(entry) {
  return `${formatDisplay(entry.left)} ${entry.operator} ${formatDisplay(entry.right)}`;
}

export default function App() {
  const [currentValue, setCurrentValue] = useState("0");
  const [previousValue, setPreviousValue] = useState("");
  const [operator, setOperator] = useState("");
  const [overwrite, setOverwrite] = useState(false);
  const [history, setHistory] = useState(getStoredHistory);

  const expression =
    previousValue && operator ? `${formatDisplay(previousValue)} ${operator}` : "";

  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage errors so the calculator keeps working normally.
    }
  }, [history]);

  function resetCalculator() {
    setCurrentValue("0");
    setPreviousValue("");
    setOperator("");
    setOverwrite(false);
  }

  function updateWithResult(result) {
    if (result === "Error") {
      setCurrentValue("Error");
      setPreviousValue("");
      setOperator("");
      setOverwrite(true);
      return;
    }

    setCurrentValue(result);
    setOverwrite(true);
  }

  function addHistoryEntry(left, right, currentOperator, result) {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      left,
      right,
      operator: currentOperator,
      result,
    };

    setHistory((existingHistory) => [entry, ...existingHistory]);
  }

  function handleDigit(value) {
    if (currentValue === "Error") {
      setCurrentValue(value);
      setOverwrite(false);
      return;
    }

    if (overwrite) {
      setCurrentValue(value);
      setOverwrite(false);
      return;
    }

    if (currentValue === "0") {
      setCurrentValue(value);
      return;
    }

    setCurrentValue((existing) => existing + value);
  }

  function handleDecimal() {
    if (currentValue === "Error") {
      setCurrentValue("0.");
      setOverwrite(false);
      return;
    }

    if (overwrite) {
      setCurrentValue("0.");
      setOverwrite(false);
      return;
    }

    if (currentValue.includes(".")) {
      return;
    }

    setCurrentValue((existing) => `${existing}.`);
  }

  function handleOperator(nextOperator) {
    if (currentValue === "Error") {
      return;
    }

    if (operator && !overwrite) {
      const result = calculate(previousValue, currentValue, operator);
      if (result === "Error") {
        updateWithResult(result);
        return;
      }

      setPreviousValue(result);
      setCurrentValue(result);
    } else if (!operator) {
      setPreviousValue(currentValue);
    }

    setOperator(nextOperator);
    setOverwrite(true);
  }

  function handleEquals() {
    if (!operator || !previousValue || currentValue === "Error") {
      return;
    }

    const leftValue = previousValue;
    const rightValue = currentValue;
    const currentOperator = operator;
    const result = calculate(leftValue, rightValue, currentOperator);

    addHistoryEntry(leftValue, rightValue, currentOperator, result);
    updateWithResult(result);
    setPreviousValue("");
    setOperator("");
  }

  function handleDelete() {
    if (currentValue === "Error") {
      resetCalculator();
      return;
    }

    if (overwrite) {
      setCurrentValue("0");
      setOverwrite(false);
      return;
    }

    if (currentValue.length === 1) {
      setCurrentValue("0");
      return;
    }

    setCurrentValue((existing) => existing.slice(0, -1));
  }

  function handleButtonPress(button) {
    switch (button.action) {
      case "digit":
        handleDigit(button.label);
        break;
      case "decimal":
        handleDecimal();
        break;
      case "operator":
        handleOperator(button.value);
        break;
      case "equals":
        handleEquals();
        break;
      case "clear":
        resetCalculator();
        break;
      case "delete":
        handleDelete();
        break;
      default:
        break;
    }
  }

  return (
    <main className="app-shell">
      <div className="calculator-layout">
        <section className="calculator-card" aria-label="Calculator">
          <div className="calculator-header">
            <p className="eyebrow">React + Vite</p>
            <h1>Calculator</h1>
          </div>

          <div className="display-panel">
            <div className="expression">{expression || " "}</div>
            <div className="display">{formatDisplay(currentValue)}</div>
          </div>

          <div className="button-grid">
            {buttons.map((button) => (
              <button
                key={button.label}
                type="button"
                className={`calc-button ${button.kind || ""} ${button.className || ""}`.trim()}
                onClick={() => handleButtonPress(button)}
              >
                {button.label}
              </button>
            ))}
          </div>
        </section>

        <section className="history-card" aria-label="Calculation history">
          <div className="history-header">
            <div>
              <p className="eyebrow">Saved locally</p>
              <h2>History</h2>
            </div>

            <button
              type="button"
              className="clear-history-button"
              onClick={() => setHistory([])}
              disabled={history.length === 0}
            >
              Clear history
            </button>
          </div>

          {history.length > 0 ? (
            <ul className="history-list">
              {history.map((entry) => (
                <li key={entry.id} className="history-item">
                  <span className="history-expression">{formatHistoryExpression(entry)}</span>
                  <span className="history-result">= {formatDisplay(entry.result)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="history-empty">Your completed calculations will show up here.</p>
          )}
        </section>
      </div>
    </main>
  );
}
