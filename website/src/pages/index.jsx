import React, { useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import CodeBlock from '@theme/CodeBlock';
import styles from './index.module.css';

const snippet = `const hinges = useHinges();

for (const hinge of hinges) {
  const { status, angle } = hinge;

  const degrees = angle === null
    ? null
    : angle * 180 / Math.PI;
}`;

function HingePreview() {
  const [angle, setAngle] = useState(Math.PI / 2);
  const posture = angle < 0.35 ? 'closed' : angle > Math.PI - 0.35 ? 'fullyOpen' : 'partiallyOpen';
  const angleLabel = `${angle.toFixed(2)} rad`;
  const fold = ((Math.PI - angle) / 2).toFixed(3);

  return (
    <figure
      className={styles.preview}
      aria-label="Illustrative hinge fold controls with example posture and angle labels. These are not live device readings."
    >
      <div className={styles.previewHeader}>
        <span className={styles.liveDot} />
        <span>NATIVE HINGE STATE</span>
        <span className={styles.previewUnit}>rad</span>
      </div>
      <div className={styles.device}>
        <div className={styles.hingeStage} style={{ '--hinge-fold': `${fold}rad`, '--hinge-left-fold': `-${fold}rad` }}>
          <div className={styles.provider}>
            <span className={styles.origin}>{posture}</span>
            <div className={`${styles.foldPanel} ${styles.leftPanel}`}>
              <div className={styles.stubTitle} />
              <div className={styles.stub} />
              <div className={styles.stub} />
              <div className={styles.tile} />
            </div>
            <div className={`${styles.foldPanel} ${styles.rightPanel}`}>
              <div className={styles.stubTitle} />
              <div className={styles.tile} />
              <div className={styles.stub} />
              <div className={styles.stub} />
            </div>
            <div className={styles.fold}>
              <span>hinge</span>
            </div>
            <div className={styles.angleTag}>
              <span>{angleLabel}</span>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.previewControls}>
        <label htmlFor="hinge-angle">Illustrative fold angle</label>
        <input
          id="hinge-angle"
          type="range"
          min="0"
          max={Math.PI}
          step="0.01"
          value={angle}
          onChange={(event) => setAngle(Number(event.target.value))}
          aria-valuetext={`${angleLabel}, ${posture}`}
        />
        <output htmlFor="hinge-angle">{angleLabel}</output>
      </div>
      <figcaption className={styles.previewCaption}>
        <span>
          <i className={styles.providerKey} /> Hierarchy
        </span>
        <span>
          <i className={styles.postureKey} /> Posture
        </span>
        <span>
          <i className={styles.angleKey} /> Angle
        </span>
        <small>Illustrative controls and readings</small>
      </figcaption>
    </figure>
  );
}

export default function Home() {
  return (
    <Layout
      title="Native hinge posture and angles"
      description="Native hinge posture, angle, and scoped subscriptions for React Native's New Architecture."
    >
      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>REACT NATIVE · NEW ARCHITECTURE</p>
            <h1>
              Hinge posture.
              <br />
              <span>Native angles.</span>
            </h1>
            <p className={styles.intro}>
              Read hinge posture and angle through a React hook. Share the same native snapshot with code outside React
              through a scoped observer.
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/docs/installation">
                Get started <span aria-hidden="true">→</span>
              </Link>
              <Link className={styles.referenceLink} to="/docs/api">
                Explore the API <span aria-hidden="true">↗</span>
              </Link>
            </div>
            <p className={styles.packageName}>react-native-hinges</p>
            <p className={styles.reanimatedNote}>
              Animate from native hinge snapshots with <Link to="/docs/reanimated">the Reanimated integration</Link>.
            </p>
          </div>
          <HingePreview />
        </section>
        <section className={styles.concepts} aria-label="Core concepts">
          <article>
            <span className={styles.number}>01 / SCOPE</span>
            <h2>Scope the observation.</h2>
            <p>Observe the existing React root. Each root has its own hinge snapshot, with no extra native view.</p>
            <Link to="/docs/usage">Use the hook →</Link>
          </article>
          <article>
            <span className={styles.number}>02 / STATE</span>
            <h2>Read what is available.</h2>
            <p>
              Native posture and a nullable angle describe each hinge. Arrays support more than one hinge without
              guessing sensor associations.
            </p>
            <Link to="/docs/api">Read the type contract →</Link>
          </article>
          <article>
            <span className={styles.number}>03 / NATIVE</span>
            <h2>Keep the native meaning.</h2>
            <p>
              UIKit hinge interactions and Android folding features share an API with explicit platform differences.
            </p>
            <Link to="/docs/platforms">See native mappings →</Link>
          </article>
        </section>
        <section className={styles.codeSection}>
          <div>
            <p className={styles.eyebrow}>ONE SNAPSHOT. TWO WAYS TO READ.</p>
            <h2>React and beyond.</h2>
            <p>
              Use <code>useHinges()</code> inside your React Native app for reactive updates.
            </p>
            <p>
              For other consumers, create an observer and use <code>get()</code> and <code>subscribe()</code> with the
              same root tag.
            </p>
            <Link to="/docs/observers">Observe outside React →</Link>
          </div>
          <CodeBlock language="tsx" title="Inside your React root">
            {snippet}
          </CodeBlock>
        </section>
        <section className={styles.exampleSection}>
          <div>
            <p className={styles.eyebrow}>SEE THE NUMBERS</p>
            <h2>Change the posture. Read the state.</h2>
            <p>
              Run the native example on a supported device or foldable emulator to inspect posture and available angle
              readings.
            </p>
          </div>
          <Link className="button button--outline button--primary" to="/docs/example">
            Run the example →
          </Link>
        </section>
      </main>
    </Layout>
  );
}
