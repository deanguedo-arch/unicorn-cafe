#!/bin/zsh
cd "${0:A:h}"
python3 rebuild.py
read "?Press Enter to close."
