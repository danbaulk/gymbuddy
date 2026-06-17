export default function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="empty">
      <h1>Welcome to GymBuddy</h1>
      <p className="muted">
        Set up a few routines (e.g. Push, Pull, Legs) and GymBuddy will rotate through
        them, one per visit. Log the weight you hit, mark the routine done, and it advances
        to the next.
      </p>
      <button className="primary big" onClick={onCreate}>
        Create your first routine
      </button>
    </section>
  );
}
