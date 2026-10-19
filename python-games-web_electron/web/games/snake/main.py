"""Snake (pygame). Arrow keys or WASD to steer, Space to restart.

Same browser rule as tic-tac-toe: async game loop with an `await` per frame,
so it runs on the desktop, in Pyodide and in pygbag without changes.
"""
import asyncio
import random

import pygame

TILE = 30
COLS, ROWS = 24, 12        # 720 x 360 play area
BAR = 40
FPS = 60
STEP_MS = 120              # snake moves one tile every 120 ms

BG = (24, 26, 33)
GRID = (32, 35, 44)
SNAKE = (81, 207, 102)
HEAD = (148, 216, 45)
FOOD = (255, 107, 107)
TEXT = (230, 230, 235)

KEYS = {
    pygame.K_UP: (0, -1), pygame.K_w: (0, -1),
    pygame.K_DOWN: (0, 1), pygame.K_s: (0, 1),
    pygame.K_LEFT: (-1, 0), pygame.K_a: (-1, 0),
    pygame.K_RIGHT: (1, 0), pygame.K_d: (1, 0),
}


def new_food(snake):
    free = [(x, y) for x in range(COLS) for y in range(ROWS) if (x, y) not in snake]
    return random.choice(free)


def new_game():
    snake = [(5, ROWS // 2), (4, ROWS // 2), (3, ROWS // 2)]
    return snake, (1, 0), new_food(snake), 0, False


async def main():
    pygame.init()
    screen = pygame.display.set_mode((COLS * TILE, ROWS * TILE + BAR))
    pygame.display.set_caption("Snake")
    font = pygame.font.Font(None, 30)

    snake, direction, food, score, dead = new_game()
    queued = []                 # turns pressed between two moves
    last_step = pygame.time.get_ticks()

    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE and dead:
                    snake, direction, food, score, dead = new_game()
                    queued.clear()
                elif event.key in KEYS and len(queued) < 3:
                    queued.append(KEYS[event.key])

        now = pygame.time.get_ticks()
        if not dead and now - last_step >= STEP_MS:
            last_step = now
            while queued:               # ignore reversing into yourself
                d = queued.pop(0)
                if (d[0] + direction[0], d[1] + direction[1]) != (0, 0):
                    direction = d
                    break
            head = ((snake[0][0] + direction[0]) % COLS,   # walls wrap around
                    (snake[0][1] + direction[1]) % ROWS)
            if head in snake[:-1]:
                dead = True
            else:
                snake.insert(0, head)
                if head == food:
                    score += 1
                    if len(snake) == COLS * ROWS:
                        dead = True      # board full: you won
                    else:
                        food = new_food(snake)
                else:
                    snake.pop()

        screen.fill(BG)
        for x in range(COLS):
            for y in range(ROWS):
                if (x + y) % 2:
                    pygame.draw.rect(screen, GRID, (x * TILE, y * TILE, TILE, TILE))
        pygame.draw.rect(screen, FOOD, (food[0] * TILE + 5, food[1] * TILE + 5, TILE - 10, TILE - 10), border_radius=8)
        for i, (x, y) in enumerate(snake):
            pygame.draw.rect(screen, HEAD if i == 0 else SNAKE,
                             (x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4), border_radius=6)

        msg = f"Score: {score}" + ("   -   Game over! Press Space to restart" if dead else "")
        label = font.render(msg, True, TEXT)
        screen.blit(label, label.get_rect(midleft=(12, ROWS * TILE + BAR // 2)))

        pygame.display.flip()
        await asyncio.sleep(1 / FPS)    # let the browser draw and handle input

    pygame.quit()


asyncio.run(main())
