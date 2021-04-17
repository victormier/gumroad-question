# Question 2: Front End

This solution focuses on the functionality of the script that will be loaded in the client. It tries to imitate as much as possible the original Gumroad solution, which uses a transparent iframe that loads a page with the product interface. It's written in plain js (ES6) to reduce the size and speed up execution.

Due to time limitations, the script uses a custom and simplified `overlay.html` page (instead of the original Gumroad one `https://gumroad.com/overlay_page?single_product_mode=true&all_permalinks={PRODUCT_PERMALINK}`) because I didn't feel it was in the scope of this exercise to reverse-engineer it. The new "test" overlay page is a basic page with a Gumroad embed in it. This has some minor limitations.

## Features

- Opens Gumroad links in an overlay
- Supports custom domains and subdomains
- Pre-fetches pages on link hover
- Clicking out of the product frame (and margin) or pressing ESC closes the overlay.

## Known issues (left on purpose due to time constraints)

- The code is written with ES6 syntax and should be transpiled to ES5, uglified, and minified using a build tool.
- The overlay page uses the Gumroad embed widget, which adds a margin to the main element which leaves a little area unclickable when attempting to close the overlay/iframe. This would not happen if we had full control of the overlay page (e.g.: not having to use the embed widget).
- Messaging between iframe and parent is insecure (we use * as the domain). Domains should be exchanged on setup between the iframe and parent.
- addEventListener is not supported by IE6-8 (could add a polyfill or use window.attachEvent).
- Mobile screens, as well as window resizing, are not supported.
- Only Chrome and Firefox's latest versions have been tested.
- The code is not production-ready for these reasons and more.
- It only supports single products (not multiple products with a cart like the widget, but this functionality should live in the overlay page).

## Run

```
yarn install
yarn run serve
```

or

```
npm install
npm run serve
```

Visit [http://localhost:8080](http://localhost:8080)

## A little product feedback

I had only been a Gumroad buyer so far, never created a product. I built a creator profile and created a product for the purpose of doing this task. I felt a bit lost at first on the /welcome page. My goal as a user was to create a product, but first I had to fill up some information that I had no idea how would be reflected on my Gumroad site (I was familiarized with Gumroad product pages more than creator pages, and was expecting to fill that up directly). Not having any specific feedback (such as a preview) on that screen made me guess what information had to be filled up, but didn't give me a hint about how that was contributing to my goal of creating/selling a product. I would maybe explore the possibility of allowing a new user to create a product (fulfill his goal) first of all, and filling his/her profile info later.
