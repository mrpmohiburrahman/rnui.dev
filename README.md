# Awesome React Native UI

Welcome to the Awesome React Native UI repository! This project showcases various UI animations and components created using React Native. Our goal is to provide a central place where developers can find and contribute amazing UI elements for their React Native applications.

## Table of Contents

- [Introduction](#introduction)
- [Contributing](#contributing)

## Introduction

This repository collects various React Native animations and UI components shared by the community. You can explore, learn, and use these animations in your own projects.

Visit our Docusaurus site to see all animations in action: [Awesome React Native UI](https://mrpmohiburrahman.github.io/awesome-react-native-ui/).

## Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding new features, or improving documentation, your help is appreciated. Please follow these guidelines to contribute:

### How to Contribute

1. **Fork the Repository**: Click the "Fork" button on the top right of this page to create a copy of this repository in your account.

2. **Prepare Your Animation Data**:

   - Navigate to the `data` folder and add information about your animation in a JSON file.
   - If an appropriate category exists, add your animation to the corresponding JSON file. If not, you can create a new category.
   - If you're unsure where to place your animation, use the `misc.json` file.

   The structure of each animation entry should be as follows:

   ```json
   {
     "caption": "Demo Caption",
     "demo": "demo/exampleCategory/example.mp4",
     "Author": "Author Name",
     "source": "https://github.com/your-repo/animation-source",
     "twitterId": "your_twitter_id",
     "linkedInId": "your_linkedin_id"
   }
   ```

   - `caption`: A brief description of the animation.
   - `demo`: Path to the demo video of the animation.
   - `Author`: Your name.
   - `source`: URL to the source code repository for the animation.
   - `twitterId`: Your Twitter username (without the `@`).
   - `linkedInId`: Your LinkedIn profile ID.

3. **Add Demo Video**:

   - Place your demo video in the `demo` folder, following the category structure defined in the `data` folder.
   - If you've created a new category, ensure the video is placed in a new folder corresponding to the category name.

4. **Update Documentation**:

   - If you've created a new category, add a corresponding `.mdx` file in the `docs` folder.
   - Ensure the documentation file provides an overview of the new category and lists the animations it contains.

5. **Commit and Push Your Changes**:

   - Create a new branch for your contribution.
   - Commit your changes with a clear message describing what you've added or modified.
   - Push your branch to your forked repository.

   ```bash
   git checkout -b feature-add-animation
   git add .
   git commit -m "Add new animation: [Animation Name]"
   git push origin feature-add-animation
   ```

6. **Create a Pull Request**:
   - Go to the original repository and open a Pull Request.
   - Provide a detailed description of your contribution, including what animation you added and any relevant information.

### Example Contribution

1. **Data Entry**: Add your animation details to the `data/loaders.json` file.

   ```json
   {
     "caption": "Circular Loader Animation",
     "demo": "demo/loaders/circular-loader.mp4",
     "Author": "Jane Doe",
     "source": "https://github.com/janedoe/circular-loader",
     "twitterId": "janedoe",
     "linkedInId": "janedoe"
   }
   ```

2. **Demo Video**: Place your video at `demo/loaders/circular-loader.mp4`.

3. **Documentation**: Add `docs/loaders.mdx` if you created a new category.

### Notes

- Ensure your contribution adheres to the coding standards and practices outlined in this repository.
- Test your additions thoroughly to ensure they work as expected.
- Contributions that do not follow these guidelines may be subject to revision or rejection.

We appreciate your contributions to the Awesome React Native UI repository. Thank you for helping us build a valuable resource for the React Native community!

---

By following these steps, you can easily add your animations to this repository. If you have any questions or need further assistance, feel free to open an issue or contact the repository maintainers.
