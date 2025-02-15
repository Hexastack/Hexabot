## How to contribute to Hexabot

#### **Did you find a bug?**

* **Do not open up a GitHub issue if the bug is a security vulnerability
  in Hexabot**, and instead send us an email to community@hexabot.ai.

* **Ensure the bug was not already reported** by searching on GitHub under [Issues](https://github.com/hexastack/hexabot/issues).

* If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/hexastack/hexabot/issues/new). Be sure to include a **title and clear description**, as much relevant information as possible, and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

#### **Did you write a patch that fixes a bug?**

* Open a new GitHub pull request with the patch.

* Ensure the PR description clearly describes the problem and solution. Include the relevant issue number if applicable.

#### **Did you fix whitespace, format code, or make a purely cosmetic patch?**

Changes that are cosmetic in nature and do not add anything substantial to the stability, functionality, or testability of Hexabot will generally not be accepted. Why ?
- Someone need to spend the time to review the patch. However trivial the changes might seem, there might be some subtle reasons the original code are written this way and any tiny changes have the possibility of altering behaviour and introducing bugs.
- It creates noise. Many poeple could be watching this repo at the time of writing – these people will get an email from github everytime someone opens a new issue, comment on a ticket, etc. They do this (probably) because they want to watch out for PRs and issues that they care about, and these PRs will further lower the signal-to-noise ratio in these notification emails.
- It pollutes the git history. When someone need to investigate a bug and git blame these lines in the future, they'll hit this "refactor" commit which is not very useful.
- It makes backporting bug fixes harder.
Theses are just some examples of the hidden costs that are not so apparent from the surface.

#### **Do you intend to add a new feature or change an existing one?**

* Suggest your change in our [Discord Channel](https://discord.gg/rNb9t2MFkG) and start writing code.

* Do not open an issue on GitHub until you have collected positive feedback about the change. GitHub issues are primarily intended for bug reports and fixes.


#### **How can i create my first contribution ?**

- **Find an Issue:**
  Start by finding an issue to work on. You can either create a new GitHub issue or pick one that has been assigned to you.

- **Create a Branch:**
  Create a new branch for your work. Use a descriptive name that reflects the issue or feature you're addressing (e.g., fix/login-bug or add/feature-x).

- **Make Changes:**
  Write or fix the code in your branch. Ensure your changes align with the project's coding standards and guidelines.

- **Push Changes:**
  Once your changes are ready, push your branch to GitHub.

- **Open a Pull Request (PR):**
  Create a pull request (PR) from your branch. Include a clear and concise description of your changes, explaining what the PR does and why it’s needed. Make sure to reference the related issue (e.g., "Fixes #123").
  Note: At least two reviewers are required to approve the PR before it can be merged.

- **Review Process:**
  Team members will review your code, provide feedback, and suggest improvements. Be open to constructive criticism and ready to iterate on your work.

- **Address Feedback:**
  Make any necessary changes based on the feedback. Once you’ve addressed the comments, tag the reviewers to let them know your updates are ready for another review.

- **Merge:**
  Once your PR is approved by at least two reviewers, it will be merged into the main project. Congratulations, your code is now part of the project!

#### **Do you have questions about the source code?**

* Ask any question about how to use Hexabot in our [Discord Channel](https://discord.gg/rNb9t2MFkG).


Hexabot's Community Edition is a volunteer effort. We encourage you to pitch in and join us!

Thanks! :heart:

Hexastack Team
