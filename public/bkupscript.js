$(function() {
    // 初期のサイズを記録しておく
    $(".draggable").each(function() {
        const $this = $(this);
        $this.data("original-width", $this.width());
        $this.data("original-height", $this.height());
    });

    $(".draggable").draggable({
        snap: ".snap-area",
        snapMode: "inner",
        snapTolerance: 30,
        // revert: "invalid"
    });

    // 吸着先すべてに droppable を適用
    $(".snap-area").droppable({
        accept: ".draggable",
        drop: function(event, ui) {
            const $target = $(this);
            const $drag = ui.draggable;

            // droppable のサイズに合わせる
            $drag.css({
                width: $target.width(),
                height: $target.height(),
                top: 0,
                left: 0,
                position: "relative"
            });

            // DOM的に中に入れる（視覚的にもぴったり）
            $drag.detach().appendTo($target);
        }
    });

    // 元のulにも droppable を設定（戻すとき用）
    $(".storage li").droppable({
        accept: ".draggable",
        drop: function(event, ui) {
            const $origin = $(this);
            const $drag = ui.draggable;

            // 元のサイズに戻す
            $drag.css({
                width: $drag.data("original-width"),
                height: $drag.data("original-height"),
                top: 0,
                left: 0,
                position: "relative"
            });

            $drag.detach().appendTo($origin);
        }
    });
});