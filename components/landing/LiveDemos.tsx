"use client";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { DeviceFrame } from "./DeviceFrame";
import { InteractivePhotoViewer } from "./InteractivePhotoViewer";
import { Reveal } from "./Reveal";
const demos = [
 { title: "Chloe & Mikael", subtitle: "A breezy Ambergris Caye affair", image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=85" },
 { title: "Kari & Darnell", subtitle: "Modern love in the city", image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=85" },
 { title: "Sofia & Mateo", subtitle: "Timeless garden romance", image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1000&q=85" },
];
export function LiveDemos() { const [active, setActive] = useState<number | null>(null); return <section className="demos section" id="demos"><Reveal className="section-heading split"><div><p className="kicker">Love, beautifully told</p><h2>Every story is<br /><em>one of a kind.</em></h2></div><p>Peek inside some of the love stories we&apos;ve had the honour of bringing to life.</p></Reveal><div className="demo-grid">{demos.map((d, i) => <Reveal delay={i * .12} key={d.title}><button className="demo-card" onClick={() => setActive(i)}><DeviceFrame title={d.title} image={d.image} tone={i === 1 ? "blush" : i === 2 ? "sand" : "sage"} /><span className="demo-name"><b>{d.title}</b><i><ArrowUpRight size={17} /></i></span></button></Reveal>)}</div><InteractivePhotoViewer items={demos} active={active} onClose={() => setActive(null)} /></section>; }
