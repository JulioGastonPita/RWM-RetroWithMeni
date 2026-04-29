import { redirect } from 'next/navigation';

// The middleware handles auth redirects; this root page just bounces to /home.
// If not authenticated, middleware will redirect to /login first.
export default function RootPage() {
  redirect('/home');
}
