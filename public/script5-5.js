// public/script5-5.js
$(function() {
    const STORAGE_KEY = "snapState5-5";

    // ---- Socket.IO 初期化 ----
    // ---- Socket.IO 初期化（恒久分離：ファイル名でデフォルトのroomを決定）----
    const qp = new URLSearchParams(location.search).get("room"); // ?room=xxx があれば最優先
    const fname = (location.pathname.split("/").pop() || "index.html"); // 直アクセス(/)もindex扱い
    const defaultRoom = fname.replace(/\.[^/.]+$/, ""); // 例: index.html→"index", index5-5.html→"index5-5"
    const room = qp || defaultRoom;

    const socket = io();
    socket.emit("room:join", room);


    let isApplyingRemote = false; // 受信反映中は再ブロードキャストしない

    // 各 draggable にユニークIDを付与（未設定のみ）
    $(".draggable").each(function(index) {
        const $this = $(this);
        if (!$this.attr("id")) $this.attr("id", "item" + index);
        $this.data("original-width", $this.width());
        $this.data("original-height", $this.height());
    });

    function enableDraggable() {
        $(".draggable").draggable({
            snap: ".snap-area",
            snapMode: "inner",
            snapTolerance: 20,
            revert: "invalid"
        });
    }
    enableDraggable();

    // 席側（seats内 <p.snap-area> など）
    $(".snap-area").droppable({
        accept: ".draggable",
        drop: function(event, ui) {
            const $target = $(this);
            const $drag = ui.draggable;

            $drag.css({
                width: $target.width(),
                height: $target.height(),
                top: 0,
                left: 0,
                position: "relative"
            });

            $drag.detach().appendTo($target);
            saveAndBroadcast();
        }
    });

    // storage 側（<li> でも安全に受けられるように）
    $(".storage li").droppable({
        accept: ".draggable",
        drop: function(event, ui) {
            const $origin = $(this);
            const $drag = ui.draggable;

            $drag.css({
                width: $drag.data("original-width"),
                height: $drag.data("original-height"),
                top: 0,
                left: 0,
                position: "relative"
            });

            $drag.detach().appendTo($origin);
            saveAndBroadcast();
        }
    });

    // ---- 状態の取得・保存・適用 ----
    function getSnapState() {
        const result = [];
        $(".draggable").each(function() {
            const $drag = $(this);
            const id = $drag.attr("id");
            const parent = $drag.parent();
            const isInSnapArea = parent.hasClass("snap-area");
            const isInStorage = parent.parent().hasClass("storage");

            result.push({
                id,
                parentType: isInSnapArea ? "snap" : isInStorage ? "storage" : "unknown",
                parentIndex: isInSnapArea ?
                    $(".snap-area").index(parent) : isInStorage ?
                    $(".storage li").index(parent) :
                    -1,
            });
        });
        return result;
    }

    function saveSnapState(state) {
        const s = state || getSnapState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
        return s;
    }

    function applySnapState(state, { fromRemote = false } = {}) {
        if (!state) return;
        isApplyingRemote = fromRemote;

        state.forEach((item) => {
            const $drag = $("#" + item.id);
            let $target;

            if (item.parentType === "snap") {
                $target = $(".snap-area").eq(item.parentIndex);
                if ($target.length) {
                    $drag.css({
                        width: $target.width(),
                        height: $target.height(),
                        top: 0,
                        left: 0,
                        position: "relative"
                    });
                    $drag.detach().appendTo($target);
                }
            } else if (item.parentType === "storage") {
                $target = $(".storage li").eq(item.parentIndex);
                if ($target.length) {
                    $drag.css({
                        width: $drag.data("original-width"),
                        height: $drag.data("original-height"),
                        top: 0,
                        left: 0,
                        position: "relative"
                    });
                    $drag.detach().appendTo($target);
                }
            }
        });

        // 親子付け替え後の再有効化とローカル保存
        enableDraggable();
        saveSnapState(state);

        isApplyingRemote = false;
    }

    // ---- 送受信 ----
    function broadcastState() {
        if (isApplyingRemote) return;
        socket.emit("state:update", getSnapState());
    }

    function saveAndBroadcast() {
        saveSnapState();
        clearTimeout(saveAndBroadcast._t);
        saveAndBroadcast._t = setTimeout(broadcastState, 30);
    }

    // 初期：ローカル保存があれば適用→共有
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved) {
        applySnapState(saved, { fromRemote: false });
        broadcastState();
    }

    // 他者の変更を適用
    socket.on("state:apply", (state) => {
        applySnapState(state, { fromRemote: true });
    });
});

$(".number-hide").on("click", function() {
    $(".seats p,.num").toggleClass("n-hide");
});
$(".gen-hide").on("click", function() {
    $(".male,.female").toggleClass("color-hide");
});