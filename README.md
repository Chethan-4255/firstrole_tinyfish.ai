# Firstrole

so Firstrole is a job and internship finder built with TinyFish, it pulls live openings from company careers pages and job portals and matches them to what you are looking for like role, location, seniority, and visa requirements. I built this because going through careers portals every week is a lot of work, so this is the tool i would actually use to keep the results fresh and spend less time refreshing careers pages.

## Features

you can set your own preferences, for suppose if you want an internship or a senior role, and you can add specific keywords you want, and it will give you structured and deduplicated listings with direct links to apply.

* **Live Web Data:** Pulls real openings directly from careers pages and job portals.
* **Custom Preferences:** Filter by role, location, seniority, keywords, and visa sponsorship.
* **Smart Matching:** Ranks jobs based on how well they match your preferences.
* **Bring Your Own Key:** Add your own TinyFish API key to use the tool locally without limits.

## Tech Stack

so the tech stack used in this project is pretty straightforward, i used Next.js and Tailwind CSS for the frontend and all the heavy lifting for finding the jobs is done by the TinyFish API which you can check out at [https://www.tinyfish.ai/](https://www.tinyfish.ai/).

* **Next.js** & **React**
* **Tailwind CSS**
* **TinyFish API** ([https://www.tinyfish.ai/](https://www.tinyfish.ai/))
* **TypeScript**

## How TinyFish is Used

so how is TinyFish used in this project?

### 1. TinyFish Search
well first is the TinyFish Search, it looks across the web to find individual job openings or official careers boards using the preferences you set, and it filters out advice and courses so you only get real openings.

### 2. TinyFish Fetch
then the TinyFish Fetch comes in, it reads those live pages and extracts the listing details like employer, location, and visa sponsorship requirements, and it converts them to see if it actually matches your preferences.

### 3. TinyFish Agent
and finally the TinyFish Agent is used when we find a careers board instead of an individual listing, so the agent actually explores the board and navigates the search filters to find the specific individual job pages and returns them.

## Setup & Installation

so to run this on your machine you first need to install the dependencies and configure your environment.

### Prerequisites
* Node.js installed on your machine
* A TinyFish API key

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chethan-4255/firstrole_tinyfish.ai.git
   cd firstrole_tinyfish.ai
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

3. **Configure your API key:**
   you need to create a `.env` file in the root folder and put your key in it.
   ```bash
   TINYFISH_API_KEY=your_api_key_here
   ```
   *(Note: You can also skip this and enter your API key directly in the app's settings UI when it's running!)*

4. **Start the development server:**
   after that you can start the development server using this command.
   ```bash
   npm run dev
   ```
   open the localhost link provided in the terminal to see the app working.

## Links

* **Developer:** Chethan Vasthaw Tippani
* **LinkedIn:** [https://www.linkedin.com/in/chethan-vasthaw/](https://www.linkedin.com/in/chethan-vasthaw/)
* **Portfolio:** [https://chethan-4255.github.io/Portfolio/](https://chethan-4255.github.io/Portfolio/)
* **GitHub Repository:** [chethan-4255/firstrole_tinyfish.ai](https://github.com/chethan-4255/firstrole_tinyfish.ai)
