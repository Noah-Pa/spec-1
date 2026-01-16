# SDG14: Shark Fin - Generative Art Project
**Version:** Final (Assignment 3)  
**Date:** January 16, 2026  

## Project Overview
This program is a responsive generative art experience designed to communicate the message: **"If the ocean dies, we die."** It serves as the interactive component of the **Maciawa Team** media campaign against shark finning.

The artwork simulates a fragile marine ecosystem where user interactions directly impact the visual and sonic environment. It metaphorically represents the destructive nature of human interference—turning a calm blue ocean into a chaotic, bloody red environment.

## Usage Notes & Interaction
**1. Core Interaction:**
- **The Ecosystem:** Users encounter a generative ocean populated by sharks and hammerheads. The environment is responsive and scales to fit different screen sizes.
- **Finning Simulation:** Clicking on living sharks triggers a "cut" event, releasing blood and severed fins. This action increases the "Chaos Factor," shifting the color palette and soundscape.

**2. Navigation & UI:**
- **"More >" Button:** Located at the top-right. Click this to open the **Information Overlay**.
- **Information Overlay:** Displays the project manifesto, SDG14 details, and links to other team members' works.
    - Hover over the team images to see student details.
    - Click on the images to visit their respective project pages.
- **"Back" Button:** Click to close the overlay and return to the generative art.
- **Mute/Unmute:** A toggle button located at the bottom-right to control the background audio.

**3. Visual Cues (Custom Cursors):**
- **Standard Cursor:** A custom graphical cursor replaces the default system arrow for immersion.
- **Pointer Cursor:** The cursor changes when hovering over interactive elements (Sharks, Buttons, Links) to signal clickability.

## Installation Instructions
1. Unzip the project folder: `COMM2754-2025-S3-A3w12-Maciawa-ProjectName.zip`.
2. Locate the `code` directory.
3. **Important:** Start a **local web server** in this directory. 
   - *Recommended:* Use the **Live Server** extension in VS Code.
   - *Alternative:* Use Python (`python -m http.server`) or Node.js http-server.
   - *Reason:* This project loads local assets (images/sounds) and requires a server environment to bypass browser CORS security policies.
4. Access `index.html` through your web browser.

## File Structure
- `index.html`: Main entry point containing the canvas container and the overlay layout.
- `styles.css`: Handles responsive styling (using `vw` units), custom fonts, and cursor definitions.
- `script.js`: Contains the p5.js logic for generative art, animation, and sound control.
- `asset/`: Contains SVG graphics (sharks, team posters, custom cursors).
- `sound/`: Contains .wav audio files (ambient, sfx, UI sounds).

## Documentation
- Detailed conceptual frameworks, technical implementation, and aesthetic choices are documented in the **Design Document (PDF)** located in the `design-documents` folder.
- The project adheres to the Maciawa team's unified visual identity (Typography: *Notable* & *Atkinson Hyperlegible Mono*; Colors: *Deep Blue & White*).

## License Information
This project is licensed under the **GNU GPL v3.0**.  
See the `LICENSE` file in the code directory for the full license text.

## Credits
This project was created by **Phan Ngoc Ha** as part of the Digital Media Specialisation course (COMM2754).

**Team Maciawa:**
- **Nguyen Thi Xuan Hien** (s4072453)
- **Phan Ngoc Ha** (s4042007)
- **Vu Minh Duc** (s4032402)

**External Resources:**
- **Libraries:** [p5.js](https://p5js.org/), [p5.sound](https://p5js.org/reference/#/libraries/p5.sound)
- **Fonts:** [Atkinson Hyperlegible Mono](https://fonts.google.com/specimen/Atkinson+Hyperlegible+Mono), [Notable](https://fonts.google.com/specimen/Notable) (via Google Fonts).

## Contact Information
- **Student Name:** Phan Ngoc Ha  
- **ID:** s4042007  
- **Email:** s4042007@rmit.edu.vn