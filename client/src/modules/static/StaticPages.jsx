import { Link } from 'react-router';
import { Button, EmptyState, PageHead } from '../../components/ui.jsx';

export function About() {
  return (
    <>
      <PageHead title="About Your NUST" subtitle="One place for everyday campus needs." />
      <div className="wrap body prose">
        <p>
          Your NUST brings together things NUST students usually sort out through scattered WhatsApp groups and notices:
          cafeteria menus and prices, lost and found items, project teammates, and carpools to and from H-12.
        </p>
        <h2>The four modules</h2>
        <ul>
          <li><strong>Cafeterias:</strong> compare menus and prices at C1 to C4.</li>
          <li><strong>Lost &amp; Found:</strong> post, search and claim lost or found items.</li>
          <li><strong>Projects:</strong> find teammates by skill and express interest safely.</li>
          <li><strong>Carpool:</strong> offer or find rides with verified members.</li>
        </ul>
        <h2>Who built it</h2>
        <p>Saniya Hassan, Sheikh Abdullah bin Zahid and Anosh Javed Mughal (BESE-15A), for CS344 Web Engineering.</p>
      </div>
    </>
  );
}

export function Safety() {
  return (
    <>
      <PageHead title="Safety guidelines" subtitle="How Your NUST keeps members safe, and what it doesn't do." />
      <div className="wrap body prose">
        <div className="notice">
          <span>
            Your NUST only connects verified members. It does not run background checks, verify drivers, provide insurance,
            guarantee rides or handle payments.
          </span>
        </div>
        <h2>Contact details stay private</h2>
        <p>
          Phone numbers and emails are never shown publicly. When you send a request, the owner sees only your name, school
          and skills. Contact details are shared only after the owner accepts.
        </p>
        <h2 id="reporting">Reporting a post</h2>
        <p>
          Every listing, project and ride has a <strong>Report</strong> link. Reports go to the admins, who can remove
          misleading, inappropriate or outdated posts.
        </p>
        <h2>Meeting someone</h2>
        <ul>
          <li>Meet in public places on campus.</li>
          <li>For rides, share your trip details with a friend.</li>
          <li>Never send money in advance.</li>
        </ul>
      </div>
    </>
  );
}

export function NotFound() {
  return (
    <div className="wrap body">
      <EmptyState title="We couldn't find that page.">
        <Button as={Link} to="/" variant="tertiary">Go home</Button>
      </EmptyState>
    </div>
  );
}
