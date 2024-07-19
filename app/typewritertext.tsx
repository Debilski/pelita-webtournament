import React, { ReactNode, useEffect, useRef } from "react";

import anime from "animejs/lib/anime.es.js";
import styles from "./typewritertext.module.css";

function TypewriterText({ text }: { text: string }) {
  // IMPORTANT: This code chokes on an empty string. Logic needs to be refactored
  const lettersHtml: ReactNode[] = (text ? text : " ").split("").map((c, i) => {
    return (
      <span className={`letter ${styles.letter}`} key={`letter,${i}`}>
        {c == " " ? "\u00A0" : c}
      </span>
    );
  });
  const lineHtml = (
    <>
      <div className="letters">{lettersHtml}</div>
      <span className={`cursor ${styles.cursor}`}></span>
    </>
  );
  const text_animation_ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = text_animation_ref.current!;
    el.style.display = "block";
    const letters = Array.from(el.querySelectorAll(".letter")) as HTMLElement[];
    const TYPE_AFTER_MS = 1_000;
    const JUMP_AFTER_MS = 80;

    const blink = anime({
      targets: el.querySelectorAll(".cursor"),
      loop: true,
      duration: 750,
      opacity: [{ value: [1, 1] }, { value: [0, 0] }],
    });

    const tl = anime
      .timeline()
      .add(
        {
          targets: el.querySelectorAll(".cursor"),
          translateX: letters.map((letter, i) => ({
            value: letter.offsetLeft + letter.offsetWidth,
            duration: 1,
            delay: i === 0 ? 0 : JUMP_AFTER_MS,
          })),
        },
        TYPE_AFTER_MS
      )
      .add(
        {
          targets: el.querySelectorAll(".letter"),
          opacity: [0, 1],
          duration: 1,
          delay: anime.stagger(JUMP_AFTER_MS),
          changeBegin: () => {
            blink.restart();
            blink.pause();
          },
          changeComplete: () => {
            blink.restart();
          },
        },
        TYPE_AFTER_MS
      );
  }, []);

  return (
    <div ref={text_animation_ref} className={styles.text_animation}>
      <h1>{lineHtml}</h1>
    </div>
  );
}

export default TypewriterText;
