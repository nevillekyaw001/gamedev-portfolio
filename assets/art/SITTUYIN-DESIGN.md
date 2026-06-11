# Sittuyin vs. Nyan — mini-game design note

**Essential experience (Schell Lens #2):** sitting across a tea-shop table from the
portfolio's owner, playing the chess of his country while he talks. The opponent *is* the
portfolio — his craft (game AI, systems design) and his voice (warm, confident, a little
cheeky) are the content.

**MDA target aesthetics:** Challenge (a real engine, real rules) + Fellowship/Expression
(the commentary makes it social, not sterile). Quantic Foundry cluster: Mastery-Achievement,
softened with personality so non-chess players still get a complete experience from one game.

**Ruleset decisions (faithful where it teaches, simplified where it blocks):**
- Faithful: piece movement (general = 1 diagonal; elephant = 1 diagonal or 1 forward; no
  double pawn step), no castling, win by checkmate, sit-ke-myin X-lines marked on the board,
  pawn→general promotion only when your general is gone and the pawn stands on an X square in
  the enemy half.
- Simplified: the free deployment (sit-tee) phase is replaced with a classic preset formation
  — deployment is the deepest part of real Sittuyin and the worst possible first-time
  onboarding step. The tutorial says so explicitly, which turns the cut into a teaching moment.
  Promotion is applied automatically rather than as a separate in-place move. Stalemate (illegal
  to inflict in real Sittuyin) is scored as a draw with a callout line.
- Sources: [Wikipedia — Sittuyin](https://en.wikipedia.org/wiki/Sittuyin),
  [ancientchess.com — How to play Sittuyin](https://ancientchess.com/page/play-sittuyin.htm).

**AI:** alpha-beta, depth 3 (4 in endgames), capture-first ordering; eval = material +
pawn-progress + centralization. Among near-equal best moves it picks with mild randomness —
optimal play feels robotic, and "humanized" was the brief.

**Personality system:** event-driven line pools (good capture, small capture, blunder, checks,
promotion, win/lose/draw, thinking) with a 25% silence gate so commentary stays an event, not a
ticker. Blunders are detected by eval swing after the AI's reply, so roasts land only when
they're earned. Tone rule: every roast is at the move, never at the player; every win funnels
gently toward GMM/contact.

**Game feel (Swink):** eased piece slides (220ms), capture scale-fade, last-move and check
highlights, legal-move dots, promotion pulse, speech-bubble pop, soft sine-wave audio ticks
(move/capture/check) behind a mute toggle, AI "thinking" delay of 350–1000ms so the opponent
appears to consider rather than compute.
