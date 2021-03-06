<!--
***
This README is based on @othneildrew's template at othneildrew/Best-README-Template.
That template is Copyright (c) 2018 Othneil Drew licensed under the MIT license.
***
-->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/zackdotcomputer/suspension">
    <img src="suspension-logo.png" alt="Logo" width="80" height="80">
  </a>

  <h3 align="center">Suspension</h3>

  <p align="center">
    A "hook in place" approach to easily integrating your existing Promise-based async data fetchers with React `<Suspense>` components.
    <br />
    <a href="https://github.com/zackdotcomputer/suspension"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <!-- <a href="https://github.com/zackdotcomputer/suspension">View Demo</a>
    · -->
    <a href="https://github.com/zackdotcomputer/suspension/issues">Report Bug</a>
    ·
    <a href="https://github.com/zackdotcomputer/suspension/issues">Request Feature</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#rigging">Rigging</a></li>
        <li><a href="#suspension-hooks">The Hooks</a></li>
      </ul>
    </li>
    <li><a href="#usage-and-bits">Usage and bits</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgements">Acknowledgements</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## About The Project

React's [experimental concurrent mode](https://reactjs.org/docs/concurrent-mode-intro.html) is clearly close to the core of the future of the project. Even though it's not quite ready for primetime as a whole today, you can easily start using one core feature in your production apps right away: `<Suspense>`.

But, because the feature is so new, it's not exactly easy to wrap your head around the ins and outs of how to make "suspenseful" apps that gracefully fall back to loading states while also using resources and time efficiently. Having banged my head against this trying to wrap an existing Promise-based interface to work with Suspense, I wound up writing this library to take the pain out of it in the future.

The core concept is to be as simple as possible. Add a "rig" high up in your app's tree as a context provider that promises-in-progress can attach to, and use hooks to wrap your existing promises and turn them into easily-beautiful suspense-compatible constructions.

### Built For

At the moment, the library is built for the React web build and requires version 16.13 or newer. If you'd like a build for react-native, drop by [this Issue](https://github.com/zackdotcomputer/suspension/issues/1) and discuss.

<!-- GETTING STARTED -->

## Getting Started

Here's the simple 1 2 3 of how to get Suspension into your app:

### Installation

Install package

```sh
npm install suspension
```

or

```sh
yarn add suspension
```

### Rigging

Hang a `<SuspensionRig>` component in your app hierarchy above the suspension hooks. You also need to make sure there is a `<Suspense>` barrier between the rig and the hook, but the rig can provide this automatically if you give it a `fallback` prop.

```jsx
function MyApp() {
  return (
    <SuspensionRig fallback={<div>Loading...</div>}>
      <AppContents />
    </SuspensionRig>
  );
}
```

### Suspension Hooks

Now that your app is rigged, your ready to use suspenseful loads! The key feature of `suspension` is that it makes using your existing Promises as easy as a hook. Here is an example in Typescript:

```tsx
function UserProfile() {
  // `useSuspension` just needs a function that returns a promise and
  // a string cacheKey to keep track of what data it is loading.
  // It handles the rest.
  const userProfile: Profile = useSuspension(async () => {
    const userObj = await getUserObj()
    return userObj.profile
  }, 'load-user-profile')

  // No need to worry about userProfile being undefined. If the function
  // gets to this point, you're guaranteed to get the value your promise
  // returned. No more half-states in your components.
  return (<>
    <h1>Welcome {userProfile.name}</h1>
    <img src={userProfile.profileImage} alt="You!" />
  </>);
}
```

<!-- USAGE EXAMPLES -->

## Usage and bits

There are three main pieces to `suspension` that you use regularly:

### SuspensionRig - Cache and fallback

`<SuspensionRig>` is a safety net for your suspension calls to fall back on. Because
suspense uses `throw` to interrupt the render process, anything that was stored in state
from that point up to the last `<Suspense>` component will be destroyed. `<SuspensionRig>`
gives a safe space **above** the last `<Suspense>` for the hooks to store their data. It
serves two main purposes in that way:

1. **It is a cache**. The rig is responsible for caching all the data about the promises
   linked to hooks beneath it. There is no limit, though, on the number of rigs you place in
   your tree and any hooks you call will use the nearest ancestor rig. So, if you have a page
   that loads in a lot of data using Suspense hooks, consider your router wrap that page in its
   own rig so that the data is cleaned up when the page is unmounted.

2. **It is the ulimate `<Suspense>`**. Because the rig needs a `Suspense` barrier between it
   and its hooks (otherwise it would be swept away by the loading event as well), it was a common
   pattern from day one to make the rig's first child a Suspense. So, that's just built-in now.
   If you want the `SuspenseRig` to behave as both a cache and a fallback `Suspense`, you just
   need to give it the same `fallback` prop you would give a `Suspense`.

### useSuspension - The ready-to-go hook

`useSuspension(generator, cacheKey, options)` is the primary hook for accessing suspension. It takes
a parameter-free generator function that returns a Promise and a cache key that uniquely identifies
this call's purpose (see below).

As soon as you call this hook, it will start your generator
going and interrupt the render cycle at that point. (Note: even if your generator returns a resolved
promise, React will always do at least one render update falling back to the `<Suspense>`.) Once the
Promise has resolved, the tree under the nearest Suspense will be reloaded and the hook will
**then** either provide you with the result of the `Promise` or throw the `Error` for your nearest
ErrorBoundary if the Promise was rejected.

This construction means that your render function will never proceed beyond this call unless it can return
to you the successfully resolved value from your `Promise`. No more needing to deal with `undefined`
loading values.

### useLazySuspension - For trickier cases

`useLazySuspension(generator, cacheKey, options)` is your friend for calls where the arguments to your
generator might change between render cycles, or where you might need to delay your generator. It takes
a generator function which can now take any number of parameters but still must return a Promise. It
also still takes that same cache key that uniquely identifies this call's purpose (still see below).

When you call this hook you will get back an array. The first element is your result and it will start
as `undefined`. The second element is your trigger function. It will have the same parameter expectations
as your generators. Whenever you want to start a new call, call the trigger function with the args. If you
call it with different args than a previous render cycle (by default this is determined using a `===` check)
then it will discard the cache and make the call again. If you call it with the same args and it has already
resolved successfully, it will reuse that result.

The trigger function also uses a bit of trickery to trigger a re-render of your component, so as soon
as you call it the host component will redraw and disappear from screen, falling back to the nearest
`<Suspense>` until the load is complete. Once the Promise has resolved, the tree under that Suspense
will be rerendered. At that point this hook will do one of two things. If the Promise resolved, the hook
will return the same array but now the first element will be the resolved value from the Promise. If
the hook was rejected, the hook will throw a `SuspensionResolutionFailedError`, which can be caught
by an ErrorBoundary. This error will have the underlying failure as well as a `retryFunction` that can
be used to retry the generator with the same args.

### Cache Keys

Because the hooks work by hanging their Promises and generators in the rig while they resolve, you need
to provide the hooks with a cache-key that describes their _purpose._

For example, let's imagine a simple social app. Consider the following four suspensions involved in rendering a profile page:

1. Fetching the current user's profile for the navbar.
2. Fetching the current user's profile for the page contents.
3. Fetching the target profile to be displayed.
4. Fetching the posts owned by the target profile to be displayed.

In this sample case, we should use 3 unique cache keys: a shared one for 1 and 2, and then unique ones for 3 and 4. This is because suspensions 1 and 2 will always make the same data request with **the same parameters**, so they will always return the same data. Suspensions 2 and 3, though, might use different parameters if you're viewing someone else's profile page, so they should use distinct cacheKeys so they don't overwrite each others' values. Finally, even though suspensions 3 and 4 will probably have the same parameters (`{target: targetUserId}`), they are fetching different kinds of data. So, they should have different cacheKeys from each other as well.

<!-- _For more examples, please refer to the [Documentation](https://example.com)_ -->

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/othneildrew/Best-README-Template/issues) for a list of proposed features (and known issues).

Currently completed landmarks on the Roadmap are:

- [x] Core functionality of hooks-in-place triggering `Suspense`
- [x] Value caching between calls
- [x] Support for UMD, ESM, and CJS module structures.
- [x] Typescript types

<!-- CONTRIBUTING -->

## Contributing

Contributions are quite literally the way we can be the change we want to see in our (devtool) world. Any contributions you make are **greatly appreciated**.

1. Fork the Project
1. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
1. Run npm's lint and test (`npm run prepublishOnly`)
1. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
1. Push to the Branch (`git push origin feature/AmazingFeature`)
1. Open a Pull Request

This project is actively used and monitored. I will get to PRs within a week.

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->

## Contact

Zack Sheppard - [@zackdotcomputer](https://twitter.com/zackdotcomputer).

Project Link: [https://github.com/zackdotcomputer/suspension](https://github.com/zackdotcomputer/suspension)

<!-- ACKNOWLEDGEMENTS -->

## Acknowledgements

- [Best Readme Template](https://github.com/othneildrew/Best-README-Template)
- @zaki-yama's [TS/NPM Package Template](https://github.com/zaki-yama/typescript-npm-package-template)
- [Img Shields](https://shields.io)
- [Prettycons](https://thenounproject.com/andrei.manolache7/)

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=for-the-badge
[contributors-url]: https://github.com/zackdotcomputer/suspension/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/othneildrew/Best-README-Template.svg?style=for-the-badge
[forks-url]: https://github.com/zackdotcomputer/suspension/network/members
[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=for-the-badge
[stars-url]: https://github.com/zackdotcomputer/suspension/stargazers
[issues-shield]: https://img.shields.io/github/issues/othneildrew/Best-README-Template.svg?style=for-the-badge
[issues-url]: https://github.com/zackdotcomputer/suspension/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/zackdotcomputer/suspension/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/zacksheppard
