
// Global workspace tracking configuration parameters
var currentScale = 1;
var maxScale = 3;
var minScale = 1;

// Drag position variables
var isDragging = false;
var startX = 0, startY = 0;
var translateX = 0, translateY = 0;

var touchStartDist = 0;
var initialScale = 1;
var isMovingBook = false;
var touchStartX = 0, touchStartY = 0;

$(document).ready(function() {

    // Helper to compute spatial distance between two active finger contacts
    function getTouchDistance(e) {
        var touches = e.originalEvent.touches;
        if (!touches || touches.length < 2) return 0;
        var dx = touches[0].clientX - touches[1].clientX;
        var dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }  

    function updatePanCursor() {
        if (currentScale > 1) {
            $("#viewport-wrapper").css("cursor", isDragging ? "grabbing" : "grab");
        } else {
            $("#viewport-wrapper").css("cursor", "default");
        }
    }

    // 1. Inject DOM nodes sequentially
    for (var i = 1; i <= totalPages; i++) {
        var pageNum = i < 10 ?  ((totalPages > 99) ? '00' : '0') + i : ((totalPages > 99 && i < 100) ? '0' : '') + i;
        var pageDiv = $('<div class="page-node"></div>');
        var img = $('<img src="./pages/' + pageNum + '.png" alt="Page ' + pageNum + '">');
        
        // Track standard item caching completions safely
        img.on('load error', function() {
            loadedCount++;
            var percent = Math.round((loadedCount / totalPages) * 100);
            $("#load-progress").text("Loading pages (" + percent + "%)");
            
            if (loadedCount === totalPages) {
                initializeBooklet();
            }
        });

        pageDiv.append(img);
        flipbook.append(pageDiv);
    }

    // 2. Setup dynamic button hide behaviors
    function updateNavigationButtons(currentPage) {
        // Fade out left arrow if looking at front cover
        if (currentPage === 1) {
            $("#prev-btn").css({ "opacity": "0", "pointer-events": "none" });
        } else {
            $("#prev-btn").css({ "opacity": "1", "pointer-events": "auto" });
        }

        // Fade out right arrow if looking at back cover
        if (currentPage === totalPages) {
            $("#next-btn").css({ "opacity": "0", "pointer-events": "none" });
        } else {
            $("#next-btn").css({ "opacity": "1", "pointer-events": "auto" });
        }
    }

    // 3. Core Engine Initialization
    function initializeBooklet() {
        flipbook.turn({
            width: 800,
            height: 500,
            page: 1,         // Force engine instantiation onto page 1 index
            autoCenter: true,
            duration: 350,   
            acceleration: true,
            gradients: true,
            elevation: 0,    
            pages: totalPages,
            when: {
                turning: function(e, page, view) {
                    isTurning = true;
                    $(".book-edge-hover").css("pointer-events", "none");

                    // --- RESET MAGNIFICATION AND POSITION TRANSLATIONS ON FLIPS ---
                    currentScale = 1;
                    translateX = 0;
                    translateY = 0;
                    updatePanCursor();

                    triggerZoomReset();

                    $("#flipbook-wrapper").css({
                        "transform": "scale(1) translate(0px, 0px)",
                        "transform-origin": "center center",
                        "transition": "transform 0.15s ease-out"
                    });
                    
                    $(".floating-footer").css({ "opacity": "0.4", "visibility": "visible" });

                    if (page == 1 || page == totalPages) {
                        flipbook.turn('corner', 'null');
                    }
                },
                turned: function(e, page, view) {
                    // Update arrow buttons whenever a page turn finishes
                    updateNavigationButtons(page);
                }
            }
        });

        // Closable/Hard Cover configuration behaviors for terminal leaves
        flipbook.turn('page', 1).addClass('hard');
        flipbook.turn('page', totalPages).addClass('hard');

        // explicit fallback to absolute index grid root position
        flipbook.turn('page', 1);

        // Run layout dimension engine scaling pass
        resizeBook();

        // Make book visible and dissolve loader screen graphics safely
        $("#flipbook-wrapper").css("visibility", "visible");
        updateNavigationButtons(1); // Run button hide logic for initial state

        $("#loader-overlay").css("opacity", 0);
        setTimeout(function() { 
            $("#loader-overlay").remove(); 
        }, 500);
    }

    // 4. Geometry Scaling framework 
    function resizeBook() {
        if (!flipbook.turn('is')) return;

        var viewW = $(window).width();
        var viewH = $(window).height();

        var targetH = viewH * 0.96; 
        var targetW = targetH * baseRatio;

        if (viewW < 768) {
            flipbook.turn('display', 'single');
            targetW = viewW * 0.92;
            targetH = targetW / (baseRatio / 2);
            if (targetH > viewH * 0.92) {
                targetH = viewH * 0.92;
                targetW = targetH * (baseRatio / 2);
            }
        } else {
            if (targetW > viewW * 0.90) {
                targetW = viewW * 0.90;
                targetH = targetW / baseRatio;
            }
            flipbook.turn('display', 'double');
        }

        $("#flipbook-wrapper").css({ width: targetW, height: targetH });
        flipbook.turn('size', targetW, targetH);
    }

    $(window).resize(function() {
        resizeBook();
    });

    // 5. User Control Interactivity mappings
    $("#next-btn").click( function(e) {
        e.preventDefault();
        if (flipbook.turn('is')) 
            flipbook.turn("next");
    });
    $("#prev-btn").click(function(e) {
        e.preventDefault();
        if (flipbook.turn('is')) 
            flipbook.turn("previous");
    });
    $(document).keydown(function(e) {
        if (!flipbook.turn('is')) 
            return;
        if (e.keyCode === 37) {
            flipbook.turn("previous");
        } 
        else if (e.keyCode === 39) {
            flipbook.turn("next");
        }
    });


// Global tracking variables for zoom level and position origin
var currentScale = 1;
var maxScale = 3;
var minScale = 1;

// Continuously update the transform origin based on cursor movement
$("#viewport-wrapper").on("mousemove", function(e) {
    if (currentScale === 1) {
        var wrapper = $("#flipbook-wrapper");
        if (!wrapper.length) return;

        var rect = wrapper[0].getBoundingClientRect();
        var mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        var mouseY = ((e.clientY - rect.top) / rect.height) * 100;

        mouseX = Math.max(0, Math.min(100, mouseX));
        mouseY = Math.max(0, Math.min(100, mouseY));

        wrapper.css("transform-origin", mouseX + "% " + mouseY + "%");
    }
});

$("#viewport-wrapper").on("mousedown", function(e) {
    // Only allow dragging when zoomed in
    if (currentScale > 1) {
        isDragging = true;
        startX = e.clientX - translateX;
        startY = e.clientY - translateY;
        updatePanCursor();
        e.preventDefault();
    }
});

$(document).on("mousemove", function(e) {
    if (!isDragging) return;

    // Calculate displacement vectors from initial down click offset positions
    translateX = e.clientX - startX;
    translateY = e.clientY - startY;

    // Apply combined transformation framework (Matrix scaling + translations)
    $("#flipbook-wrapper").css({
        "transform": "scale(" + currentScale + ") translate(" + (translateX / currentScale) + "px, " + (translateY / currentScale) + "px)",
        "transition": "none" // Disables inertia transitions during tracking for crisp feedback
    });
});

$(document).on("mouseup", function() {
    if (isDragging) {
        isDragging = false;
        updatePanCursor();
    }
});

// Interactive scroll wheel handler
// Find your existing workspace scroll wheel handler block, update its visibility rules:
$("#viewport-wrapper").on("wheel", function(e) {
    if (!$("#flipbook").turn("is")) return;
    
    e.preventDefault(); 
    var delta = e.originalEvent.deltaY;
    var zoomStep = 0.15; 

    if (delta < 0) {
        currentScale = Math.min(maxScale, currentScale + zoomStep);
    } else {
        currentScale = Math.max(minScale, currentScale - zoomStep);
    }

    if (currentScale === 1) {
        // Run standard cleanup parameters
        translateX = 0;
        translateY = 0;
        $("#flipbook-wrapper").css({
            "transform": "scale(1) translate(0px, 0px)",
            "transition": "transform 0.15s ease-out"
        });
        
        // Hide button when scale drops back to baseline
        $("#floating-reset-zoom-btn").css({ "opacity": "0", "visibility": "hidden", "pointer-events": "none" });

        $(".book-edge-hover").css("pointer-events", "auto");
        $(".floating-footer").css({ "opacity": "0.4", "visibility": "visible" });

        setTimeout(function() {
            if (currentScale === 1) {
                $("#flipbook-wrapper").css("transform-origin", "center center");
            }
        }, 150);
    } else {
        $("#flipbook-wrapper").css({
            "transform": "scale(" + currentScale + ") translate(" + (translateX / currentScale) + "px, " + (translateY / currentScale) + "px)",
            "transition": "transform 0.08s ease-out" 
        });

        // Show button semi-transparently while zoomed in
        $("#floating-reset-zoom-btn").css({ "opacity": "0.5", "visibility": "visible", "pointer-events": "auto" });

        $(".book-edge-hover").css("pointer-events", "none");
        $(".floating-footer").css({ "opacity": "0", "visibility": "hidden" });
    }
    
    updatePanCursor();
});


// Reusable tracking script to reset the workspace back to baseline 100% scale
function triggerZoomReset() {
    currentScale = 1;
    translateX = 0;
    translateY = 0;
    updatePanCursor();

    // Smoothly animate the page wrapper frame back to center canvas targets
    $("#flipbook-wrapper").css({
        "transform": "scale(1) translate(0px, 0px)",
        "transition": "transform 0.25s ease-out" // Gives a pleasant snap effect on click
    });

    // Hide the reset button smoothly
    $("#floating-reset-zoom-btn").css({ "opacity": "0", "visibility": "hidden", "pointer-events": "none" });

    // Restore interactive components
    $(".book-edge-hover").css("pointer-events", "auto");
    $(".floating-footer").css({ "opacity": "0.4", "visibility": "visible" });

    setTimeout(function() {
        if (currentScale === 1) {
            $("#flipbook-wrapper").css("transform-origin", "center center");
        }
    }, 250);
}

// Bind click event handler to the new element
$("#floating-reset-zoom-btn").click(function(e) {
    e.preventDefault();
    triggerZoomReset();
});

// Intercept touch initialization inputs
$("#viewport-wrapper").on("touchstart", function(e) {
    var numTouches = e.originalEvent.touches.length;

    // --- CASE A: TWO FINGERS INITIALIZE PINCH EXPAND ---
    if (numTouches === 2) {
        isMovingBook = false; 
        touchStartDist = getTouchDistance(e);
        initialScale = currentScale;
    }
    // --- CASE B: SINGLE FINGER INITIATES ZOOM DRAG PAN ---
    else if (numTouches === 1 && currentScale > 1) {
        isMovingBook = true;
        touchStartX = e.originalEvent.touches[0].clientX - translateX;
        touchStartY = e.originalEvent.touches[0].clientY - translateY;
    }
});

// Dynamic movement vector updater loop
$("#viewport-wrapper").on("touchmove", function(e) {
    var numTouches = e.originalEvent.touches.length;

    // --- CASE A: TRACKING ACTIVE RETINA PINCH COMPRESSIONS ---
    if (numTouches === 2 && touchStartDist > 0) {
        e.preventDefault(); // Lock browser layout bounds completely
        var currentDist = getTouchDistance(e);
        if (currentDist === 0) return;

        var pinchFactor = currentDist / touchStartDist;
        currentScale = Math.min(maxScale, Math.max(minScale, initialScale * pinchFactor));

        if (currentScale === 1) {
            translateX = 0;
            translateY = 0;
            $("#flipbook-wrapper").css({
                "transform": "scale(1) translate(0px, 0px)",
                "transition": "none"
            });
            $("#floating-reset-zoom-btn").css({ "opacity": "0", "visibility": "hidden", "pointer-events": "none" });
            $(".book-edge-hover").css("pointer-events", "auto");
            $(".floating-footer").css({ "opacity": "0.4", "visibility": "visible" });
        } else {
            $("#flipbook-wrapper").css({
                "transform": "scale(" + currentScale + ") translate(" + (translateX / currentScale) + "px, " + (translateY / currentScale) + "px)",
                "transition": "none"
            });
            $("#floating-reset-zoom-btn").css({ "opacity": "0.6", "visibility": "visible", "pointer-events": "auto" });
            $(".book-edge-hover").css("pointer-events", "none");
            $(".floating-footer").css({ "opacity": "0", "visibility": "hidden" });
        }
        updatePanCursor();
    }
    // --- CASE B: TRACKING MOBILE MULTI-AXIS DRAG PANNING ---
    else if (numTouches === 1 && isMovingBook && currentScale > 1) {
        e.preventDefault();
        translateX = e.originalEvent.touches[0].clientX - touchStartX;
        translateY = e.originalEvent.touches[0].clientY - touchStartY;

        $("#flipbook-wrapper").css({
            "transform": "scale(" + currentScale + ") translate(" + (translateX / currentScale) + "px, " + (translateY / currentScale) + "px)",
            "transition": "none"
        });
    }
});

// Reset position memory blocks on touch releases safely
$(document).on("touchend touchcancel", function(e) {
    if (e.originalEvent.touches.length < 2) {
        touchStartDist = 0;
    }
    if (e.originalEvent.touches.length === 0) {
        isMovingBook = false;
    }
});

   
});