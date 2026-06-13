/*
 * Sittuyin — Burmese chess vs. Nyan.
 * Simplified faithful ruleset: real piece moves, X-line promotion,
 * no double pawn step. Free deployment phase is replaced by a classic
 * preset so visitors can start playing immediately (noted in tutorial).
 * AI: iterative alpha-beta with capture-first ordering. Personality on top.
 */
(function () {
  'use strict';

  var root = document.getElementById('sittuyin');
  if (!root) return;

  // ---------------------------------------------------------------- state
  // Board: 64 cells, index = rank * 8 + file. Rank 0 = Red home (visitor).
  // Red pieces uppercase, Black (Nyan) lowercase.
  var board, turn, gameOver, lastMove, moveCount, audioCtx, muted = false;
  var thinking = false;

  var VAL = { P: 100, F: 220, S: 260, N: 380, R: 550, K: 20000 };
  // Royal army iconography of the old Burmese kingdoms. Each disc is one
  // soldier: crown (king), sword (general), war elephant, cavalry horse,
  // chariot wheel, and the foot soldier (pawn).
  var GLYPH = {
    K: '#p-king', F: '#p-general', S: '#p-elephant',
    N: '#p-horse', R: '#p-chariot', P: '#p-pawn'
  };
  var NAME = {
    K: 'King · Min-gyi', F: 'General · Sit-ke', S: 'Elephant · Sin',
    N: 'Horse · Myin', R: 'Chariot · Yahhta', P: 'Pawn · Nè'
  };

  function initialBoard() {
    var b = new Array(64).fill(null);
    var back = ['R', 'N', 'S', 'F', 'K', 'S', 'N', 'R'];
    for (var f = 0; f < 8; f++) {
      b[f] = back[f];                       // red rank 1
      b[56 + f] = back[f].toLowerCase();    // black rank 8
    }
    for (f = 0; f < 4; f++) { b[16 + f] = 'P'; b[32 + f] = 'p'; }   // a3-d3, a5-d5
    for (f = 4; f < 8; f++) { b[24 + f] = 'P'; b[40 + f] = 'p'; }   // e4-h4, e6-h6
    return b;
  }

  function isRed(pc) { return pc && pc === pc.toUpperCase(); }
  function onX(i) { var r = i >> 3, f = i & 7; return r === f || r + f === 7; }

  // ------------------------------------------------------------- movegen
  var KDIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  var NJUMPS = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
  var DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  var ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  function pseudoMoves(b, red) {
    var moves = [];
    for (var i = 0; i < 64; i++) {
      var pc = b[i];
      if (!pc || isRed(pc) !== red) continue;
      var r = i >> 3, f = i & 7, t = pc.toUpperCase(), fwd = red ? 1 : -1;
      var add = function (rr, ff) {
        if (rr < 0 || rr > 7 || ff < 0 || ff > 7) return false;
        var j = rr * 8 + ff, tgt = b[j];
        if (tgt && isRed(tgt) === red) return false;
        moves.push({ from: i, to: j, cap: tgt || null });
        return !tgt;
      };
      if (t === 'P') {
        var j = (r + fwd) * 8 + f;
        if (r + fwd >= 0 && r + fwd <= 7 && !b[j]) moves.push({ from: i, to: j, cap: null });
        [f - 1, f + 1].forEach(function (ff) {
          if (ff < 0 || ff > 7) return;
          var k = (r + fwd) * 8 + ff, tgt = b[k];
          if (r + fwd >= 0 && r + fwd <= 7 && tgt && isRed(tgt) !== red) {
            moves.push({ from: i, to: k, cap: tgt });
          }
        });
      } else if (t === 'F') {
        DIAG.forEach(function (d) { add(r + d[0], f + d[1]); });
      } else if (t === 'S') {
        DIAG.forEach(function (d) { add(r + d[0], f + d[1]); });
        add(r + fwd, f);
      } else if (t === 'N') {
        NJUMPS.forEach(function (d) { add(r + d[0], f + d[1]); });
      } else if (t === 'R') {
        ORTH.forEach(function (d) {
          var rr = r + d[0], ff = f + d[1];
          while (rr >= 0 && rr <= 7 && ff >= 0 && ff <= 7 && add(rr, ff)) {
            rr += d[0]; ff += d[1];
          }
        });
      } else if (t === 'K') {
        KDIRS.forEach(function (d) {
          add(r + d[0], f + d[1]);
        });
      }
    }
    return moves;
  }

  function kingSq(b, red) {
    var k = red ? 'K' : 'k';
    for (var i = 0; i < 64; i++) if (b[i] === k) return i;
    return -1;
  }

  function attacked(b, sq, byRed) {
    var ms = pseudoMoves(b, byRed);
    for (var i = 0; i < ms.length; i++) if (ms[i].to === sq) return true;
    return false;
  }

  function applyMove(b, m, red) {
    var nb = b.slice();
    var pc = nb[m.from];
    nb[m.to] = pc; nb[m.from] = null;
    // Simplified promotion: pawn standing on an X-line square in the enemy
    // half becomes a general, if your general is gone.
    if (pc.toUpperCase() === 'P' && onX(m.to)) {
      var r = m.to >> 3;
      var enemyHalf = red ? r >= 4 : r <= 3;
      var hasF = nb.indexOf(red ? 'F' : 'f') !== -1;
      if (enemyHalf && !hasF) {
        nb[m.to] = red ? 'F' : 'f';
        m.promoted = true;
      }
    }
    return nb;
  }

  function legalMoves(b, red) {
    return pseudoMoves(b, red).filter(function (m) {
      var nb = applyMove(b, m, red);
      return !attacked(nb, kingSq(nb, red), !red);
    });
  }

  function inCheck(b, red) { return attacked(b, kingSq(b, red), !red); }

  // ------------------------------------------------------------------ AI
  var PROG = [0, 6, 12, 20, 30, 42, 56, 70];  // pawn progress bonus by rank steps

  function evaluate(b) {
    // Positive favors Black (Nyan).
    var score = 0;
    for (var i = 0; i < 64; i++) {
      var pc = b[i];
      if (!pc) continue;
      var t = pc.toUpperCase(), v = VAL[t], r = i >> 3, f = i & 7;
      var center = 3.5 - Math.max(Math.abs(r - 3.5), Math.abs(f - 3.5));
      var bonus = 0;
      if (t === 'P') bonus = PROG[isRed(pc) ? r : 7 - r];
      else if (t === 'N' || t === 'S' || t === 'F') bonus = center * 8;
      else if (t === 'R') bonus = center * 3;
      else if (t === 'K') bonus = -center * 4;   // kings prefer the edge early
      score += (isRed(pc) ? -1 : 1) * (v + bonus);
    }
    return score;
  }

  function orderMoves(ms) {
    return ms.sort(function (a, b) {
      return (b.cap ? VAL[b.cap.toUpperCase()] : 0) - (a.cap ? VAL[a.cap.toUpperCase()] : 0);
    });
  }

  function alphabeta(b, depth, alpha, beta, redToMove) {
    if (depth === 0) return evaluate(b);
    var ms = orderMoves(legalMoves(b, redToMove));
    if (!ms.length) {
      if (inCheck(b, redToMove)) return redToMove ? 30000 - depth : -30000 + depth;
      return 0;  // stalemate → draw value
    }
    if (redToMove) {  // minimizing (visitor)
      var best = Infinity;
      for (var i = 0; i < ms.length; i++) {
        var v = alphabeta(applyMove(b, ms[i], true), depth - 1, alpha, beta, false);
        if (v < best) best = v;
        if (best < beta) beta = best;
        if (beta <= alpha) break;
      }
      return best;
    }
    var bestB = -Infinity;
    for (var j = 0; j < ms.length; j++) {
      var vb = alphabeta(applyMove(b, ms[j], false), depth - 1, alpha, beta, true);
      if (vb > bestB) bestB = vb;
      if (bestB > alpha) alpha = bestB;
      if (beta <= alpha) break;
    }
    return bestB;
  }

  function aiSelectMove() {
    var ms = orderMoves(legalMoves(board, false));
    if (!ms.length) return null;
    var pieces = board.filter(Boolean).length;
    var depth = pieces > 18 ? 3 : 4;
    var scored = ms.map(function (m) {
      return { m: m, v: alphabeta(applyMove(board, m, false), depth - 1, -Infinity, Infinity, true) };
    });
    scored.sort(function (a, b) { return b.v - a.v; });
    // Humanity: among near-equal best moves, pick with mild randomness.
    var top = scored.filter(function (s) { return s.v >= scored[0].v - 18; });
    var pick = top[Math.floor(Math.random() * top.length)];
    return { move: pick.m, eval: pick.v, bestEval: scored[0].v };
  }

  // ----------------------------------------------------------- personality
  var LINES = {
    intro: [
      "Alright, tea's poured. You're Red, you go first. Let's see what you've got.",
      "Burmese chess, my house, my rules. You move first though - I'm not a monster.",
      "Welcome to the board. Be brave, be reckless, just don't be boring.",
      "You sit, I'll talk. That's usually how this goes. Your move."
    ],
    playerGoodCapture: [
      "Oof. Okay, that actually hurt a little.",
      "Clean. Did you just hustle me on my own website?",
      "Respect. That's the move I'd have played.",
      "Now we're playing. I'm awake now.",
      "Stop that. That was good and I don't like it."
    ],
    playerSmallCapture: [
      "A pawn? Sure, take the snack. The kitchen's still mine.",
      "Cute little capture. Adorable, even.",
      "You got one. Want a sticker?",
      "Fine, fair trade. I wasn't using that one anyway."
    ],
    playerBlunder: [
      "Oh no. Oh nooo. You didn't.",
      "That piece was holding the whole house up, by the way.",
      "I'm taking that, and I'm taking it personally.",
      "Bold strategy. Let's see how it plays out... it played out badly.",
      "My students do that. Then they don't do it again.",
      "You really just left that there for me? Thank you, truly."
    ],
    aiCapture: [
      "Mine now. I'll give it a good home.",
      "Snap. Order beats chaos, every single time.",
      "Thanks for that - goes straight to the trophy shelf.",
      "I saw that three moves ago, friend.",
      "Gone. Don't look so surprised."
    ],
    aiCheck: [
      "Check. Your king's looking a little nervous.",
      "Check! No castling here - he has to sweat this one out.",
      "Check. I'd run if I were him. Actually, you can't run far.",
      "Knock knock. It's check."
    ],
    playerCheck: [
      "Check?! On me? The disrespect. I love it.",
      "Okay okay, I see you. Settle down.",
      "Cornering me already? Bold. I get scary when cornered.",
      "A check on my own board. Screenshot that, it won't last."
    ],
    thinking: [
      "Hmm.", "Let me cook.", "Interesting...", "One sec.", "Plotting.", "Ooh."
    ],
    aiWin: [
      "Checkmate. GG though - you've got instincts. Imagine those with actual training.",
      "Checkmate! Good game. Seriously, come find me, I teach this stuff.",
      "And that's the game. You lasted longer than most. Rematch?"
    ],
    playerWin: [
      "...Checkmate. On me. Okay, you win - now email me, clearly we should talk.",
      "You actually beat me. I'm impressed and a little betrayed. Well played.",
      "GG. I'm filing this under 'learning experience'. Rematch when my ego heals?"
    ],
    draw: [
      "A draw. Honourable. We shake hands and pretend we both had it.",
      "Stalemate - technically illegal in real Sittuyin, so let's just stay friends."
    ],
    promote: [
      "And my little pawn becomes a general. They grow up so fast.",
      "Promotion! See, hard work on the gold line pays off.",
      "Field promotion. He's earned it."
    ],
    playerPromote: [
      "You found the promotion rule. Now you're dangerous.",
      "Promoted on the gold line - told you those weren't just decoration.",
      "Look at you, growing a general. Respect."
    ]
  };

  function say(pool, force) {
    var bubble = root.querySelector('[data-say]');
    if (!bubble) return;
    if (!force && Math.random() < 0.25) return;  // don't narrate every move
    var lines = LINES[pool];
    var line = lines[Math.floor(Math.random() * lines.length)];
    bubble.textContent = line;
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
  }

  // ----------------------------------------------------------------- audio
  function blip(freq, dur, vol) {
    if (muted) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); o.stop(audioCtx.currentTime + dur);
    } catch (e) { /* audio unavailable — stay silent */ }
  }
  var sndMove = function () { blip(220, 0.08, 0.05); };
  var sndCapture = function () { blip(140, 0.15, 0.08); };
  var sndCheck = function () { blip(440, 0.2, 0.05); };

  // ------------------------------------------------------------------- UI
  var boardEl = root.querySelector('[data-board]');
  var squares = [], pieceEls = {};
  var selected = null, pieceSeq = 0;

  function buildBoard() {
    boardEl.innerHTML = '';
    squares = [];
    for (var r = 7; r >= 0; r--) {
      for (var f = 0; f < 8; f++) {
        var i = r * 8 + f;
        var sq = document.createElement('div');
        sq.className = 'sq ' + (((r + f) % 2) ? 'sq-light' : 'sq-dark');
        sq.dataset.i = i;
        sq.addEventListener('click', onSquareClick);
        boardEl.appendChild(sq);
        squares[i] = sq;
      }
    }
    // sit-ke-myin: the two great diagonals, drawn as one crisp full-board
    // overlay so each spans corner to corner (above squares, below pieces).
    var ns = 'http://www.w3.org/2000/svg';
    var lines = document.createElementNS(ns, 'svg');
    lines.setAttribute('class', 'board-lines');
    lines.setAttribute('viewBox', '0 0 8 8');
    lines.setAttribute('preserveAspectRatio', 'none');
    lines.setAttribute('aria-hidden', 'true');
    [['0', '0', '8', '8'], ['8', '0', '0', '8']].forEach(function (c) {
      var ln = document.createElementNS(ns, 'line');
      ln.setAttribute('x1', c[0]); ln.setAttribute('y1', c[1]);
      ln.setAttribute('x2', c[2]); ln.setAttribute('y2', c[3]);
      lines.appendChild(ln);
    });
    boardEl.appendChild(lines);
  }

  function pieceNode(pc, i) {
    var el = document.createElement('div');
    el.className = 'piece ' + (isRed(pc) ? 'piece-red' : 'piece-black');
    el.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="' +
      GLYPH[pc.toUpperCase()] + '"/></svg>';
    el.title = NAME[pc.toUpperCase()];
    positionPiece(el, i);
    boardEl.appendChild(el);
    return el;
  }

  function positionPiece(el, i) {
    var r = i >> 3, f = i & 7;
    el.style.transform = 'translate(' + (f * 100) + '%,' + ((7 - r) * 100) + '%)';
  }

  function syncPieces() {
    // Rebuild piece layer from board state (used on new game).
    Object.keys(pieceEls).forEach(function (k) { pieceEls[k].remove(); });
    pieceEls = {}; pieceSeq = 0;
    for (var i = 0; i < 64; i++) {
      if (board[i]) {
        var id = 'pc' + (pieceSeq++);
        pieceEls[id] = pieceNode(board[i], i);
        pieceEls[id].dataset.sq = i;
      }
    }
  }

  function elAt(i) {
    for (var k in pieceEls) if (+pieceEls[k].dataset.sq === i) return pieceEls[k];
    return null;
  }

  function clearHints() {
    squares.forEach(function (s) {
      s.classList.remove('sel', 'hint', 'hint-cap', 'last', 'check');
    });
  }

  function paintState() {
    clearHints();
    if (lastMove) {
      squares[lastMove.from].classList.add('last');
      squares[lastMove.to].classList.add('last');
    }
    if (!gameOver) {
      if (inCheck(board, true)) squares[kingSq(board, true)].classList.add('check');
      if (inCheck(board, false)) squares[kingSq(board, false)].classList.add('check');
    }
  }

  function animateMove(m, red, done) {
    var moving = elAt(m.from);
    var victim = m.cap ? elAt(m.to) : null;
    if (victim) {
      victim.classList.add('captured');
      setTimeout(function () { victim.remove(); }, 300);
      for (var k in pieceEls) if (pieceEls[k] === victim) delete pieceEls[k];
    }
    if (moving) {
      positionPiece(moving, m.to);
      moving.dataset.sq = m.to;
      if (m.promoted) {
        setTimeout(function () {
          var use = moving.querySelector('use');
          if (use) use.setAttribute('href', GLYPH.F);
          moving.classList.add('promoted');
          celebrate(moving, 14);
        }, 220);
      }
    }
    (m.cap ? sndCapture : sndMove)();
    setTimeout(done, 240);
  }

  function setStatus(text) {
    root.querySelector('[data-status]').textContent = text;
  }

  function celebrate(el, n) {
    // Sparks via the cursor layer, if it's running.
    if (typeof window.__spark !== 'function' || !el) return;
    var r = el.getBoundingClientRect();
    window.__spark(r.left + r.width / 2, r.top + r.height / 2, n);
  }

  function endGame(result) {
    gameOver = true;
    thinking = false;
    boardEl.classList.add('done');
    if (result === 'aiWin') { say('aiWin', true); setStatus('Checkmate - Nyan wins.'); }
    else if (result === 'playerWin') {
      say('playerWin', true);
      setStatus('Checkmate - you win!');
      celebrate(boardEl, 36);
    }
    else { say('draw', true); setStatus('Draw.'); }
  }

  // ---------------------------------------------------------------- turns
  function afterPlayerMove(m, preEval) {
    lastMove = m; moveCount++;
    paintState();
    if (m.promoted) say('playerPromote', true);

    var aiMs = legalMoves(board, false);
    if (!aiMs.length) {
      endGame(inCheck(board, false) ? 'playerWin' : 'draw');
      return;
    }
    if (inCheck(board, false)) { say('playerCheck', true); sndCheck(); }
    else if (m.cap) {
      say(VAL[m.cap.toUpperCase()] >= 260 ? 'playerGoodCapture' : 'playerSmallCapture');
    }

    thinking = true;
    setStatus('Nyan is thinking…');
    if (Math.random() < 0.4) say('thinking', true);

    setTimeout(function () {
      var res = aiSelectMove();
      thinking = false;
      if (!res) { endGame(inCheck(board, false) ? 'playerWin' : 'draw'); return; }

      // Blunder detection: position swung hard toward Nyan after your move.
      var swing = res.bestEval - preEval;
      board = applyMove(board, res.move, false);
      animateMove(res.move, false, function () {
        lastMove = res.move;
        paintState();
        if (res.move.promoted) say('promote', true);

        var playerMs = legalMoves(board, true);
        if (!playerMs.length) {
          endGame(inCheck(board, true) ? 'aiWin' : 'draw');
          return;
        }
        if (inCheck(board, true)) { say('aiCheck', true); sndCheck(); }
        else if (res.move.cap && swing > 180) say('playerBlunder', true);
        else if (res.move.cap) say('aiCapture');
        setStatus('Your move.');
      });
    }, 350 + Math.random() * 650);
  }

  function onSquareClick(e) {
    if (gameOver || thinking || turn !== 'red') return;
    var i = +e.currentTarget.dataset.i;
    var pc = board[i];

    if (selected !== null) {
      var ms = legalMoves(board, true).filter(function (m) { return m.from === selected; });
      var m = ms.find(function (mm) { return mm.to === i; });
      if (m) {
        var preEval = evaluate(board);
        board = applyMove(board, m, true);
        selected = null;
        animateMove(m, true, function () { afterPlayerMove(m, preEval); });
        return;
      }
    }
    if (pc && isRed(pc)) {
      selected = (selected === i) ? null : i;
      paintState();
      if (selected !== null) {
        squares[i].classList.add('sel');
        legalMoves(board, true).forEach(function (mm) {
          if (mm.from === i) squares[mm.to].classList.add(mm.cap ? 'hint-cap' : 'hint');
        });
      }
    } else {
      selected = null;
      paintState();
    }
  }

  // -------------------------------------------------------------- tutorial
  var TUTORIAL = [
    {
      title: 'Sittuyin - Burmese chess',
      body: "This is the chess of Myanmar, played for centuries in tea shops and temple courtyards. The pieces are lacquer discs - yours red, mine black - and each carries the mark of the old royal army. You play Red, and Red moves first. Win by checkmating my king. No castling, no shortcuts."
    },
    {
      title: 'The royal army',
      body: "Six ranks, six jobs. The crown is the King (Min-gyi): one step, any direction. The sword is the General (Sit-ke): one step, diagonal only. The Elephant (Sin): one step diagonal, or one straight forward. The Horse (Myin): exactly a chess knight. The Chariot wheel (Yahhta): exactly a rook. And the Pawn (Nè), your foot soldier: one step forward, captures on the diagonal, no double-step. Hover any disc and I'll tell you who it is."
    },
    {
      title: 'The gold lines',
      body: "See the gold diagonals crossing the board? Those are the sit-ke-myin, the general's lines. If your general is gone, a pawn standing on a gold square in my half is promoted to a new general. One more honest note: real Sittuyin lets you deploy your pieces freely before the game begins - here I've set up a classic formation for both of us, so we can get straight to playing."
    },
    {
      title: 'One more thing',
      body: "I'll be commenting on your moves. I'm told I can be... encouraging. Tap a red disc to see where it can go. Good luck - you'll need a little."
    }
  ];
  var tutStep = 0;

  function showTutorial(step) {
    tutStep = step;
    var ov = root.querySelector('[data-tutorial]');
    ov.hidden = false;
    ov.querySelector('[data-tut-title]').textContent = TUTORIAL[step].title;
    ov.querySelector('[data-tut-body]').textContent = TUTORIAL[step].body;
    ov.querySelector('[data-tut-step]').textContent = (step + 1) + ' / ' + TUTORIAL.length;
    ov.querySelector('[data-tut-back]').disabled = step === 0;
    ov.querySelector('[data-tut-next]').textContent =
      step === TUTORIAL.length - 1 ? 'Play' : 'Next';
  }

  function hideTutorial() {
    root.querySelector('[data-tutorial]').hidden = true;
    say('intro', true);
  }

  // ----------------------------------------------------------------- wire
  function newGame() {
    board = initialBoard();
    turn = 'red'; gameOver = false; lastMove = null; moveCount = 0;
    selected = null; thinking = false;
    boardEl.classList.remove('done');
    syncPieces();
    paintState();
    setStatus('Your move. You play Red.');
  }

  root.querySelector('[data-tut-next]').addEventListener('click', function () {
    if (tutStep === TUTORIAL.length - 1) hideTutorial();
    else showTutorial(tutStep + 1);
  });
  root.querySelector('[data-tut-back]').addEventListener('click', function () {
    if (tutStep > 0) showTutorial(tutStep - 1);
  });
  root.querySelector('[data-tut-skip]').addEventListener('click', hideTutorial);
  root.querySelector('[data-rules]').addEventListener('click', function () {
    showTutorial(0);
  });
  root.querySelector('[data-newgame]').addEventListener('click', function () {
    newGame();
    say('intro', true);
  });
  var muteBtn = root.querySelector('[data-mute]');
  muteBtn.addEventListener('click', function () {
    muted = !muted;
    muteBtn.textContent = muted ? 'Sound: off' : 'Sound: on';
  });

  buildBoard();
  newGame();
  showTutorial(0);
})();
