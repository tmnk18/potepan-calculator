class Calculator {
  constructor(displaySelector, buttonSelector) {
    // 設定値を定数として定義
    this.CONFIG = {
      ERROR_TEXT: 'Error', // エラー時に表示するテキスト
      DEFAULT_VAL: '0', // 初期値
      MAX_DIGITS: 12, // 表示可能な最大桁数
      EXPONENT_DIGITS: 6, // 指数表示の桁数
      OPERATORS: ['+', '-', '*', '/'], // 利用可能な演算子
    };

    // 初期化
    this.expression = this.CONFIG.DEFAULT_VAL; // 計算式を保持する変数
    this.isResultDisplayed = false; // 計算結果が表示されているかを管理
    this.$display = $(displaySelector); // 表示要素
    this.$buttons = $(buttonSelector); // ボタン要素
    this.operatorsRegex = new RegExp(`[\\${this.CONFIG.OPERATORS.join('\\')}]`); // 演算子を判定する正規表現

    // 初期スクロール位置を右端に設定
    this.scrollToRight();

    // ボタンのイベントリスナーを設定
    this.initializeEventListeners();
  }

  // 現在の計算式を画面に表示
  updateDisplay() {
    this.$display.text(this.expression);
    this.scrollToRight(); // 表示更新後にスクロール位置を右端に移動
  }

  // スクロールバーを常に右端に移動
  scrollToRight() {
    this.$display.scrollLeft(this.$display[0].scrollWidth);
  }

  // 計算式をリセットして初期状態に戻す
  resetExpression() {
    this.expression = this.CONFIG.DEFAULT_VAL; // 計算式を初期値に戻す
    this.isResultDisplayed = false; // 計算結果表示状態をリセット
  }

  // 計算式を評価して結果を表示
  calculateResult() {
    try {
      if (!this.expression || this.expression === this.CONFIG.ERROR_TEXT) return; // 式が空やエラーの場合は何もしない

      const lastChar = this.expression.slice(-1); // 計算式の最後の文字
      if (this.CONFIG.OPERATORS.includes(lastChar)) return; // 最後が演算子の場合は無視

      let result = eval(this.expression); // 計算式を評価
      this.expression =
        result.toString().length > this.CONFIG.MAX_DIGITS
          ? result.toExponential(this.CONFIG.EXPONENT_DIGITS) // 桁数が多い場合は指数表示
          : result.toString(); // 通常の文字列として表示
      this.isResultDisplayed = true; // 計算結果を表示状態にする
    } catch {
      this.expression = this.CONFIG.ERROR_TEXT; // エラー時はエラーメッセージを設定
      this.isResultDisplayed = false; // 計算結果表示状態をリセット
    }
  }

  // 演算子を追加または置き換え
  handleOperator(value) {
    if (this.isResultDisplayed) this.isResultDisplayed = false; // 計算結果表示状態をリセット

    // 式が空や初期値、エラー状態の場合は初期値に戻す
    if (
      !this.expression ||
      this.expression === this.CONFIG.DEFAULT_VAL ||
      this.expression === this.CONFIG.ERROR_TEXT
    ) {
      this.expression = this.CONFIG.DEFAULT_VAL;
    }

    // 式の最後が演算子の場合、置き換える
    if (this.CONFIG.OPERATORS.includes(this.expression.slice(-1))) {
      this.expression = this.expression.slice(0, -1);
    }

    // 演算子を追加
    this.expression += value;
  }

  // 0または00を適切に処理
  handleZero(value) {
    if (this.isResultDisplayed) {
      // 計算結果表示状態の場合、初期値に戻す
      this.expression = this.CONFIG.DEFAULT_VAL;
      this.isResultDisplayed = false;
      return;
    }

    const lastChar = this.expression.slice(-1); // 式の最後の文字
    const currentNumber = this.expression.split(this.operatorsRegex).pop(); // 現在入力中の数値

    // "000"などを防ぐ
    if (value === '0' && lastChar === '0' && currentNumber === '0') return;

    // 00の特別な処理
    if (value === '00' && this.CONFIG.OPERATORS.includes(lastChar)) {
      this.expression += '0'; // 先頭の00は1つの0として扱う
      return;
    }

    if (
      value === '00' &&
      (/^0+$/.test(currentNumber) || this.operatorsRegex.test(this.expression.slice(-2)))
    ) {
      return;
    }

    // ゼロを追加
    this.expression += value;
  }

  // 小数点の入力を処理
  handleDot() {
    if (this.isResultDisplayed) {
      // 計算結果表示状態の場合、初期化して"0."を設定
      this.expression = '0.';
      this.isResultDisplayed = false;
      return;
    }

    const currentNumber = this.expression.split(this.operatorsRegex).pop(); // 現在入力中の数値
    if (!currentNumber.includes('.')) {
      // 小数点がまだ含まれていない場合のみ追加
      this.expression += this.CONFIG.OPERATORS.includes(this.expression.slice(-1)) ? '0.' : '.';
    }
  }

  // 数字の入力を処理
  handleNumber(value) {
    if (
      this.isResultDisplayed || // 計算結果が表示されている場合
      this.expression === this.CONFIG.DEFAULT_VAL || // 初期状態の場合
      this.expression === this.CONFIG.ERROR_TEXT // エラー状態の場合
    ) {
      this.expression = value; // 数字を入力
      this.isResultDisplayed = false; // 計算結果表示状態をリセット
    } else {
      this.expression += value; // 数字を追加
    }
  }

  // ボタンのイベントリスナーを初期化
  initializeEventListeners() {
    this.$buttons.click((event) => {
      const value = $(event.target).attr('data-value'); // クリックされたボタンの値を取得

      // 入力に対応するハンドラを定義
      const handlers = {
        'AC': () => this.resetExpression(), // クリアボタン
        '=': () => this.calculateResult(), // イコールボタン
        '+': () => this.handleOperator('+'), // 足し算
        '-': () => this.handleOperator('-'), // 引き算
        '*': () => this.handleOperator('*'), // 掛け算
        '/': () => this.handleOperator('/'), // 割り算
        '0': () => this.handleZero('0'), // 0
        '00': () => this.handleZero('00'), // 00
        '.': () => this.handleDot(), // 小数点
        default: () => this.handleNumber(value), // 数字
      };

      // 適切なハンドラを呼び出す
      const handler = handlers[value] || handlers.default;
      handler();
      this.updateDisplay(); // 表示を更新
    });
  }
}

// ページ読み込み時に電卓を初期化
$(document).ready(() => {
  new Calculator('.display', '.btn');
});