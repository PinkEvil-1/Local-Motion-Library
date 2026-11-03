// Report formatting can be verified without rerunning the browser.
export function renderAcceptanceReport(report) {
  const time = new Intl.DateTimeFormat('zh-TW', {timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).format(new Date(report.testedAt));
  const passed = report.results.filter(result => result.pass).length;
  const cases = report.results.map(result => '- ' + (result.pass ? '通過' : '未通過') + '：' + result.name + (result.error ? '（錯誤：' + result.error + '）' : '')).join('\n');
  const tick = String.fromCharCode(96);
  return '# 獨立驗收報告\n\n' +
    '執行方式：先啟動本地網站，再執行 ' + tick + 'node tests/acceptance.mjs' + tick + '。驗證網址：' + report.base + '。\n\n' +
    '驗證工具：Microsoft Edge ／ Playwright。驗證時間：' + time + '（台北時間，UTC+8）。\n\n' +
    '驗收結果：共 ' + report.results.length + ' 項，' + passed + ' 項通過，' + (report.results.length - passed) + ' 項未通過。\n\n' + cases + '\n\n' +
    '所有驗收情境皆會攔截並記錄外部 HTTP 請求；本次記錄到 ' + report.externalRequests.length + ' 筆外部請求、' + report.pageErrors.length + ' 筆頁面錯誤。\n\n' +
    '畫面截圖：[preview.png](preview.png)。結構化結果：[acceptance-results.json](acceptance-results.json)。\n\n' +
    '驗證範圍：應用程式操作流程。此報告不代表已確認與原站逐像素一致，也未涵蓋全部 331 個動畫的所有互動。逐項演示初始化與短時間錯誤檢查結果另見 [demo-verification.json](demo-verification.json)。\n';
}
