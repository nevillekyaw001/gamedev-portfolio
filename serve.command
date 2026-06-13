#!/bin/bash
# Double-click this file to preview the portfolio locally with everything
# working (CSS, JS, the 3D controller). Opening index.html directly does
# NOT work because of the ?v= cache-busting query strings and ES modules.
cd "$(dirname "$0")" || exit 1
PORT=8000
echo "Serving portfolio at http://localhost:$PORT"
echo "Leave this window open. Press Ctrl+C (or close it) to stop."
# open the browser shortly after the server starts
( sleep 1; open "http://localhost:$PORT" ) &
python3 -m http.server "$PORT"
