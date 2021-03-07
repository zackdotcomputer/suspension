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
    <img src="suspension-logo.png" alt="Logo" width="120" height="120">
  </a>

  <h3 align="center">Suspension</h3>

  <p align="center">
    A "hook in place" approach to easily integrating your existing Promises and async/await data fetchers with React <pre><Suspense></pre> components.
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
        <li><a href="#built-for">Built For React</a></li>
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
    <li><a href="#usage-and-details">Usage and Details</a></li>
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

At the moment, the library is built for the React web build and requires version 16.13 or newer.

A react-native build would be realistically possible as well, so if you'd like that please drop by [this Issue](https://github.com/zackdotcomputer/suspension/issues/1) and discuss.

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

Now that your app is rigged, your ready to use the hooks! The key feature of `suspension` is that it makes using your existing Promises with Suspense as easy as a hook. Here is an example in Typescript:

```tsx
function UserProfile() {
  // `useSuspension` just needs a function that returns a promise and
  // a string cacheKey to keep track of what data it is loading.
  // It handles the rest.
  const userProfile: Profile = useSuspension(async () => {
    const userObj = await getUserObj();
    return userObj.profile;
  }, "load-user-profile");

  // No need to worry about userProfile being undefined. If the function
  // gets to this point, you're guaranteed to get the value your promise
  // returned. No more half-states in your components.
  return (
    <>
      <h1>Welcome {userProfile.name}</h1>
      <img src={userProfile.profileImage} alt="You!" />
    </>
  );
}
```

<!-- USAGE EXAMPLES -->

## Usage and Details

There are three main pieces to `suspension`:

### `<SuspensionRig>` - Your cache and fallback

`<SuspensionRig>` is a safety net for your suspension calls to fall back on. Because
suspense uses `throw` to interrupt the render process, anything that was stored in state
from that point up to the last `<Suspense>` component will be destroyed. `<SuspensionRig>`
gives a safe space **above** the last `<Suspense>` for the hooks to store their data. In addition
to just being a landing space for Promises, the rig has three other roles:

1. **It is a cache**. The rig is responsible for caching all the data about the promises
   linked to hooks beneath it. There is no limit on the number of rigs you place in
   your tree. Suspension hooks will use their nearest ancestor rig. So, if you have a single
   component that loads in a lot of data, consider your router wrap that page in its own rig
   so that the data is cleaned up when the rig is unmounted.

2. **It is your fallback `<Suspense>`**. Because the rig needs a `Suspense` barrier between it
   and its hooks (otherwise it would be swept away by the loading throw as well), it was a common
   pattern from day one to make the rig's first child a Suspense. So, I built that in.
   If you give the `SuspenseRig` the same `fallback` prop as you would give a `Suspense`, the
   right will automatically create a `Suspense` wall below it with that fallback.

3. **It is your Error Boundary**. Similarly you can also pass an `errorBoundary` prop to have it
   act as your Error Boundary. Under the hood, this feature uses
   [react-error-boundary](https://github.com/bvaughn/react-error-boundary).
   You can pass anything in the `errorBoundary` object that you can pass as a prop to that library.
   If the prop is present, the rig will insert a boundary below itself and above its other children.

### `useSuspension` - The ready-to-go hook

`useSuspension` is the primary hook for accessing suspension. It has a slightly different form
depending on whether your data generator function takes arguments or not, but both forms share
the need for a generator, a cacheKey that identifies this call's purpose (see below), and an
optional object with configuration options. If your generator takes args, you can pass those
as an array as well.

```typescript
// With a generator that takes args:
useSuspension(generator, cacheKey, argsArray, options);

// With a generator that doesn't:
useSuspension(generator, cacheKey, options);
```

The first time you call this hook it will immediately start your generator and interrupt the
render cycle. (Note: even if your generator returns a pre-resolved promise, React will always do at
least one render update falling back to the `<Suspense>`.) Once the Promise has resolved, the tree
under the nearest Suspense will be reloaded and the hook will **then** either provide you with the
result of your generator or throw the `Error` for your nearest ErrorBoundary if the Promise was
rejected.

This means that your render function will never proceed beyond this call unless it can return
the resolved value from your `Promise`. No more needing to deal with `undefined` loading values.

### `useLazySuspension` - For a bit more finesse

`useLazySuspension(generator, cacheKey, options)` is for calls where you need more control over
when or whether your generator is called. This hook takes the same parameters as `useSuspension`
except that you never pass the args to the hook.

This hook returns an array with two elements. The first element is your lazy reader function. It takes
the args for your generator and will return the resolved value if it has one for those args, undefined
if it doesn't, or will throw an error if the Promise was rejected. If the promise is still in progress,
this reader will throw the pending promise to trigger Suspense.

The second element is your suspenseful loading function. It also should be called with the args for your
generator. This function will always return the resolved value for those args, or it will throw a Promise
if it does not yet have them. **Note** this function will never throw an Error on failure. If you call
it and the most recent Promise was rejected, this function will start a new call.

### Failures and `SuspensionResolutionFailedError`

If the `useSuspension` hook's promise is rejected or if the lazy reader is used to access a value that
most recently was rejected, those calls will throw a `SuspensionResolutionFailedError`.
This error can be caught by an ErrorBoundary and will contain the underlying error from the Promise
as well as a `retryFunction` that can be used to retry the generator with the same args.

### Caching

When you call the `useSuspension` hook or call the functions returned by `useLazySuspension` the
Rig will check if results are already cached.

It will do this based on your supplied cache key and the args list you provide. By default the args
lists are compared using the `===` comparison. You can override this using the options object's
`shouldRefreshData` property, which should be a function that takes two arrays of arguments and returns
whether they are different enough to merit a refresh.

### Cache Keys

Because the hooks work by hanging their Promises and results in the rig, you need to provide a
cache-key that describes each hook's _purpose._ This is to avoid collisions between two accesses
of the same data source with different parameters.

For example, let's imagine a simple social app. Consider the following four suspensions involved in rendering a profile page:

1. Fetching the current user's profile for the navbar.
2. Fetching the current user's profile for the page contents.
3. Fetching the target profile to be displayed.
4. Fetching the posts owned by the target profile to be displayed.

In this sample case, we should use 3 unique cache keys: a shared one for 1 and 2, and then unique ones for 3 and 4. This is because suspensions 1 and 2 will always make the same data request with **the same parameters**, so they will always return the same data. Suspensions 2 and 3, though, might use different parameters if you're viewing someone else's profile page, so they should use distinct cacheKeys to avoid overwriting each others' values. Finally, even though suspensions 3 and 4 will probably have the same parameters (`{target: targetUserId}`), they are fetching different kinds of data. So, they should have different cacheKeys from each other as well.

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

- [TSdx](https://tsdx.io/)
- [Best Readme Template](https://github.com/othneildrew/Best-README-Template)
- [Img Shields](https://shields.io)
- [Prettycons](https://thenounproject.com/andrei.manolache7/)
- Though not a fork, Suspension is nonetheless building on the conceptual foundation laid by the [use-async-resource](https://github.com/andreiduca/use-async-resource) package and I'd be remiss not to acknolwedge that project.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/zackdotcomputer/suspension.svg?style=for-the-badge
[contributors-url]: https://github.com/zackdotcomputer/suspension/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/zackdotcomputer/suspension.svg?style=for-the-badge
[forks-url]: https://github.com/zackdotcomputer/suspension/network/members
[stars-shield]: https://img.shields.io/github/stars/zackdotcomputer/suspension.svg?style=for-the-badge
[stars-url]: https://github.com/zackdotcomputer/suspension/stargazers
[issues-shield]: https://img.shields.io/github/issues/zackdotcomputer/suspension.svg?style=for-the-badge
[issues-url]: https://github.com/zackdotcomputer/suspension/issues
[license-shield]: https://img.shields.io/github/license/zackdotcomputer/suspension.svg?style=for-the-badge
[license-url]: https://github.com/zackdotcomputer/suspension/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/zacksheppard
