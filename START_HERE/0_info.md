
This is just a workflow I am just trying out, since now Opus 4 (and now Opus 4.1) can handle this type of thing, so it's what I used for this project:

I started with the file `.claude/agents/meta-agent.md` and used that to generate the other agents by asking "please create a react expert agent", "please create a deep research expert", ...

I then used claude code to manually assign them all the correct tools (read/write files, execute commands, use context7 MCP for docs) and once I had all of them, I asked to set up the project based on the PDF that I put in the "assignment" folder and the image from the PDF that I screenshotted.
That can be found in `1_initial_prompt.md`.

Then, I basically just copy/pasted errors into claude until I had a running application (I guess I could have set up the playwright MCP and automated this) - this can be seen in `2_fixing_import_errors.md`.

And at last, I told Claude to run the Uncle Bob subagent to make sure the code was clean, and told it to update the readme with all the info - this can be seen in `3_uncle_bob.md`.