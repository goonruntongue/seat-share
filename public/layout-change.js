$(".upside-down-button").on("click", function() {
    $(".stage").toggleClass("upside-down");
});

function limitWidth() {
    $("p").each(function() {
        const $this = $(this);
        const currentWidth = $this.width();
        $this.css("max-width", currentWidth);
    });
}
window.addEventListener("resize", limitWidth);
limitWidth();