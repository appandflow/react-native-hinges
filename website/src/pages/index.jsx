import React from 'react';
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
  return (
    <figure
      className={styles.preview}
      aria-label="Illustration of two display panels joined by a hinge, with example posture and angle labels. These are illustrative, not live device readings."
    >
      <div className={styles.previewHeader}>
        <span className={styles.liveDot} />
        <span>NATIVE HINGE STATE</span>
        <span className={styles.previewUnit}>rad</span>
      </div>
      <div className={styles.device}>
        <div className={styles.provider}>
          <span className={styles.origin}>partiallyOpen</span>
          <div className={styles.panes}>
            <div className={styles.pane}>
              <div className={styles.stubTitle} />
              <div className={styles.stub} />
              <div className={styles.stub} />
              <div className={styles.tile} />
            </div>
            <div className={styles.pane}>
              <div className={styles.stubTitle} />
              <div className={styles.tile} />
              <div className={styles.stub} />
              <div className={styles.stub} />
            </div>
          </div>
          <div className={styles.fold}>
            <span>hinge</span>
          </div>
          <div className={styles.angleTag}>
            <span>1.57 rad</span>
          </div>
        </div>
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
        <small>Illustrative readings</small>
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
          </div>
          <HingePreview />
        </section>
        <section className={styles.concepts} aria-label="Core concepts">
          <article>
            <span className={styles.number}>01 / SCOPE</span>
            <h2>Scope the observation.</h2>
            <p>Attach observation to the intended native hierarchy. Each provider supplies its own hinge snapshot.</p>
            <Link to="/docs/usage">Use the provider →</Link>
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
              Use <code>useHinges()</code> beneath a <code>HingeProvider</code> for reactive updates.
            </p>
            <p>
              For other consumers, create an observer and use <code>get()</code> and <code>subscribe()</code> with the
              same provider.
            </p>
            <Link to="/docs/observers">Observe outside React →</Link>
          </div>
          <CodeBlock language="tsx" title="Inside your provider">
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
