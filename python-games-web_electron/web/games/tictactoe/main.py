"""Tic-tac-toe for two players on one computer (pygame).

Runs unchanged on the desktop (python main.py), in the browser via Pyodide,
and in the browser via pygbag. The only browser-specific rule: the game loop
is `async` and gives control back to the browser every frame with
`await asyncio.sleep(...)`. Without that, the browser tab freezes.
"""
import asyncio

import pygame

CELL = 120
BOARD = CELL * 3          # 360 x 360 board
BAR = 50                  # status bar under the board
FPS = 30

BG = (24, 26, 33)
GRID = (70, 75, 90)
X_COLOR = (255, 107, 107)
O_COLOR = (77, 171, 247)
TEXT = (230, 230, 235)

LINES = [(0, 1, 2), (3, 4, 5), (6, 7, 8),
         (0, 3, 6), (1, 4, 7), (2, 5, 8),
         (0, 4, 8), (2, 4, 6)]


def find_winner(board):
    for a, b, c in LINES:
        if board[a] and board[a] == board[b] == board[c]:
            return board[a], (a, c)
    if all(board):
        return "draw", None
    return None, None


def cell_center(i):
    return (i % 3) * CELL + CELL // 2, (i // 3) * CELL + CELL // 2


def draw(screen, font, board, turn, winner, win_line):
    screen.fill(BG)
    for k in (1, 2):
        pygame.draw.line(screen, GRID, (k * CELL, 10), (k * CELL, BOARD - 10), 4)
        pygame.draw.line(screen, GRID, (10, k * CELL), (BOARD - 10, k * CELL), 4)

    for i, mark in enumerate(board):
        cx, cy = cell_center(i)
        r = CELL // 2 - 24
        if mark == "X":
            pygame.draw.line(screen, X_COLOR, (cx - r, cy - r), (cx + r, cy + r), 10)
            pygame.draw.line(screen, X_COLOR, (cx - r, cy + r), (cx + r, cy - r), 10)
        elif mark == "O":
            pygame.draw.circle(screen, O_COLOR, (cx, cy), r, 9)

    if win_line:
        pygame.draw.line(screen, TEXT, cell_center(win_line[0]), cell_center(win_line[1]), 6)

    if winner == "draw":
        msg = "Draw! Click to play again"
    elif winner:
        msg = f"{winner} wins! Click to play again"
    else:
        msg = f"{turn}'s turn"
    label = font.render(msg, True, TEXT)
    screen.blit(label, label.get_rect(center=(BOARD // 2, BOARD + BAR // 2)))


async def main():
    pygame.init()
    screen = pygame.display.set_mode((BOARD, BOARD + BAR))
    pygame.display.set_caption("Tic-tac-toe")
    font = pygame.font.Font(None, 32)

    board = [None] * 9
    turn = "X"
    winner, win_line = None, None

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                if winner:                      # game over: click restarts
                    board, turn = [None] * 9, "X"
                    winner, win_line = None, None
                    continue
                x, y = event.pos
                if 0 <= x < BOARD and 0 <= y < BOARD:
                    i = (y // CELL) * 3 + x // CELL
                    if board[i] is None:
                        board[i] = turn
                        winner, win_line = find_winner(board)
                        turn = "O" if turn == "X" else "X"

        draw(screen, font, board, turn, winner, win_line)
        pygame.display.flip()
        # Wait for the next frame AND let the browser breathe. Used instead of
        # clock.tick(), which busy-waits (freezes) inside a browser.
        await asyncio.sleep(1 / FPS)

    pygame.quit()


asyncio.run(main())
