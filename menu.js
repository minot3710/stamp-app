// ハンバーガーメニュー
$(".openBtn").click(function () {
  $(this).toggleClass("active");
  $("#gNav").toggleClass("panelactive");
});

$("#gNav a").click(function () {
  $(".openBtn").removeClass("active");
  $("#gNav").removeClass("panelactive");
});

