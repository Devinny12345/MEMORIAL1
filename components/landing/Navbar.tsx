"use client";
import { Menu, X } from "lucide-react";
import { useState } from "react";
const links = [["How it works", "#how-it-works"], ["Demos", "#demos"], ["Packages", "#pricing"], ["Our story", "#about"]];
export function Navbar() { const [open, setOpen] = useState(false); return <header className="nav"><a href="#top" className="brand"><span>say yes</span><i>belize</i></a><nav>{links.map(([label, href]) => <a href={href} key={label}>{label}</a>)}</nav><a className="nav-cta" href="#booking">Let&apos;s celebrate <span>↗</span></a><button className="menu" onClick={() => setOpen(!open)} aria-label="Toggle menu">{open ? <X /> : <Menu />}</button>{open && <div className="mobile-nav">{links.map(([label, href]) => <a onClick={() => setOpen(false)} href={href} key={label}>{label}</a>)}<a href="#booking">Book now</a></div>}</header>; }
