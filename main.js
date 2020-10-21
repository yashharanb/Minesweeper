window.addEventListener('load', main);

let timer = null;

function startTimer() {
    stopTimer();
    let start = Date.now();

    timer = setInterval(function() {
        // Divide by 1000 to convert ms to s
        let elapsed = Math.floor((Date.now() - start)/1000);
        document.querySelector(".timer").textContent = elapsed;
    }, 1000);
}

function stopTimer() {
    clearInterval(timer);
}

/**
 * callback for left clicking a square
 * - uncover cell that has been clicked
 * - check for game completion condition
 * @param {MSGame} game 
 * @param {number} index 
 */
function square_left_cb(game, index) {
    let status = game.getStatus();
    const row = Math.floor(index / status.ncols);
    const col = index % status.ncols;

    // if (status.nuncovered === 0) {
    //     startTimer();
    // }

    game.uncover(row, col);
    render(game);

    // get updated status after uncovering the square
    status = game.getStatus();

    // check if game is done and activate overlay if it is
    if (status.done) {
        stopTimer(); 

        document.querySelector("#overlay").classList.toggle("active");
        if (status.exploded) {
            // mine exploded so game has been lost
            document.querySelector(".big").textContent = "Sorry, you lost. Try again.";
        }
        else {
            // all non-mine cells have been uncovered so game has been won
            document.querySelector(".big").textContent = "Congratulations, you won!";
        }
    }
}

/**
 * callback for right clicking a square
 * - place a flag on cell that has been clicked
 * @param {MSGame} game 
 * @param {number} index 
 */
function square_right_cb(game, index) {
    const status = game.getStatus();
    const row = Math.floor(index / status.ncols);
    const col = index % status.ncols;

    game.mark(row, col);
    render(game);
}

/**
 * callback for the difficulty level buttons
 * - create new game
 * - render the state
 * 
 * @param {MSGame} game
 * @param {number} rows 
 * @param {number} cols 
 */

function menu_cb(game, rows, cols, mines) {
    startTimer();

    game.init(rows, cols, mines);
    render(game);
}

/**
 * creates enough squares for largest board (20x24)
 * registers callbacks for squares
 * 
 * @param {MSGame} game 
 */
function prepare_dom(game) {
    const grid = document.querySelector(".grid");
    const maxSize = 20 * 24; // max grid size

    for (let i = 0; i < maxSize; i++) {
        const square = document.createElement("div");
        square.className = "square";
        square.setAttribute("data-squareInd", i);

        square.addEventListener("click", () => {
            square_left_cb(game, i);
        });

        square.addEventListener("contextmenu", e => {
            square_right_cb(game, i);
            // prevent right click menu from being displayed
            e.preventDefault();
        });

        grid.appendChild(square);
    }
}

/**
 * updates DOM to reflect current state
 * - hides unnecessary squares by setting their display: none
 * - adds "flipped" class to cards that were flipped
 * 
 * @param {MSGame} game 
 */
function render(game) {
    const rendering = game.getRendering();
    const status = game.getStatus();
    const grid = document.querySelector(".grid");
    grid.style.gridTemplateColumns = `repeat(${status.ncols}, 1fr)`;

    // grid.style.gridTemplateRows = `repeat(${status.nrows}, 1fr)`;

    for (let i = 0; i < grid.children.length; i++) {
        const square = grid.children[i];
        const ind = Number(square.getAttribute("data-squareInd"));

        if (ind >= status.nrows * status.ncols) {
            // hide squares outside game board size for current difficulty
            square.style.display = "none";
        }
        else {
            if (status.nuncovered === 0) {
                // New game started, so clear previous status of each square
                square.className = "square";
            }

            square.style.display = "block";
            const row = Math.floor(ind / status.ncols);
            const col = ind % status.ncols;
            const state = rendering[row][col];
            square.classList.add("_" + state);
            
            // if (state === "H") {
            //     square.textContent = "";
            // }
            // else {
            //     square.textContent = state;
            // }
        }
    }

    document.querySelectorAll(".mineCount").forEach(
        (e) => {
            // display number of remaining mines
            e.textContent = String(status.nmines - status.nmarked);
        });
}

function main() {
    let game = new MSGame();

    // register callbacks for buttons
    document.querySelectorAll(".menuButton").forEach((button) => {
        [rows, cols, mines] = button.getAttribute("data-size").split("x").map(s => Number(s));
        button.addEventListener("click", menu_cb.bind(null, game, rows, cols, mines));
    });

    // callback for overlay click - hide overlay and regenerate game
    document.querySelector("#overlay").addEventListener("click", () => {
        document.querySelector("#overlay").classList.remove("active");
        menu_cb(game, game.getStatus().nrows, game.getStatus().ncols, game.getStatus().nmines); 
    });

    // create enough squares for largest game and register click callbacks
    prepare_dom(game);

    render(game);

    // simulate pressing Easy button to start new game
    menu_cb(game, 8, 10, 10);
}