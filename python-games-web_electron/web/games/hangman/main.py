"""Hangman - a plain console game.

Nothing browser-specific here: ordinary print() and input().
The web page runs it in a background worker where input() is allowed to wait.
"""
import random

WORDS = ["python", "browser", "keyboard", "monitor", "variable", "function",
         "electron", "network", "pixel", "algorithm", "database", "compiler"]

STAGES = [
    "",
    "\n\n\n\n\n=========",
    "\n      |\n      |\n      |\n      |\n=========",
    "  +---+\n      |\n      |\n      |\n      |\n=========",
    "  +---+\n  |   |\n      |\n      |\n      |\n=========",
    "  +---+\n  |   |\n  O   |\n      |\n      |\n=========",
    "  +---+\n  |   |\n  O   |\n  |   |\n      |\n=========",
    "  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n=========",
    "  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n=========",
]
MAX_MISSES = len(STAGES) - 1


def play_round():
    word = random.choice(WORDS)
    guessed = set()
    misses = 0

    while True:
        print(STAGES[misses])
        print("Word:   " + " ".join(c if c in guessed else "_" for c in word))
        wrong = sorted(guessed - set(word))
        print("Missed: " + (", ".join(wrong) if wrong else "-"))

        if all(c in guessed for c in word):
            print(f"\nYou got it! The word was '{word}'.")
            return
        if misses == MAX_MISSES:
            print(f"\nHanged! The word was '{word}'.")
            return

        guess = input("Guess a letter: ").strip().lower()
        if len(guess) != 1 or not guess.isalpha():
            print("Type exactly one letter.")
        elif guess in guessed:
            print(f"You already tried '{guess}'.")
        else:
            guessed.add(guess)
            if guess not in word:
                misses += 1
        print()


def main():
    print("=== HANGMAN ===")
    while True:
        play_round()
        again = input("\nPlay again? (y/n): ").strip().lower()
        if again != "y":
            print("Thanks for playing!")
            break
        print()


if __name__ == "__main__":
    try:
        main()
    except (EOFError, KeyboardInterrupt):
        print("\nBye!")
