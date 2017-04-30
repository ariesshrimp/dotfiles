# Git Blame

See Git Blame information in the status bar for the currently selected line.

![Feature Usage](https://github.com/Sertion/vscode-gitblame/raw/master/images/GitBlamePreview.gif)

# Install

Open up VS Code.

1. Press `F1`
2. Type `ext` in command palette
3. Select "install" and hit enter
4. Type `blame`
5. Select "Git Blame" extension and hit enter

# Backlog

* Click on the status bar to see more blame info, [including commit SHA](https://github.com/waderyan/vscode-gitblame/issues/3)
* [Show blame line ranges](https://github.com/waderyan/vscode-gitblame/issues/1)

# [Known Issues](https://github.com/waderyan/vscode-gitblame/issues)

# Update Log

Version 1.1

* Reduced text size which was causing the blame info not to show. 
* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/5) (credit to [@fogzot](https://github.com/fogzot)) that searches for .git in parent dirs.

Version 1.2

* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/10) replacing 'Hello World' message with hash and commit message (credit to [@carloscz](https://github.com/carloscz)).

Version 1.3

* Merged in [PR](https://github.com/waderyan/vscode-gitblame/pull/12) to make the status bar message interactive (credit to [@j-em](https://github.com/j-em));

Version 1.4

* Now respects changes made in the git working tree when blaming
* Updating dependencies
* Updating to new repository

Version 1.5

* Spring cleaning

Version 1.6

* More granular time info
* Adding a re-check of blame info on save
