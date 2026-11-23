import { Stepper } from "./Stepper";

export default function BookLayout({ children }: LayoutProps<"/book">) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <Stepper />
      <div className="mt-8">{children}</div>
    </div>
  );
}
