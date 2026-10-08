import Image from "next/image";

export function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <a className="brand" href="/" aria-label="Hisab home">
      <Image
        className="brand-logo"
        src="/hisab-logo-transparent.png"
        alt="Hisab"
        width={1942}
        height={809}
        sizes="240px"
        priority
      />
      {inverted && (
        <Image
          className="brand-logo brand-logo-light"
          src="/hisab-logo-transparent.png"
          alt=""
          aria-hidden="true"
          width={1942}
          height={809}
          sizes="240px"
          priority
        />
      )}
    </a>
  );
}
