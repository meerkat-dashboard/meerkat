import { h, render } from "preact";

import { Editor } from "./editor";

// Paths are of the form /my-dashboard/view
const elems = window.location.pathname.split("/");
const slug = elems[elems.length - 2]
render(<Editor slug={slug} />, document.body);
