import React from "react"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function page() {
  return (
    <section className=" mb-96">
      {/* Container */}
      <div className="mx-auto w-full max-w-7xl px-5 py-12 md:px-10 md:py-16 lg:py-20 ">
        {/* Component */}
        <div className="grid gap-12 sm:gap-20 lg:grid-cols-2">
          {/* Content */}
          <div className="flex flex-col items-start gap-2">
            <div className="flex items-center rounded-md bg-gray-300 px-3 py-1">
              <div className="mr-1 h-2 w-2 rounded-full bg-green-500" />
              <p className="text-sm">Available for work</p>
            </div>
            <p className="text-sm text-gray-500 sm:text-xl">
              Mobile App Developer (React Native)
            </p>
            {/* Title */}
            <h1 className="mb-6 text-4xl font-bold md:text-4xl lg:mb-8">
              MD. MOHIBUR RAHMAN
            </h1>
            <p className="text-sm text-gray-500 sm:text-xl">
              I'm an experienced React Native developer with 4 years of
              experience including 3 years working remotely.
              <br />
              <br />I am an active contributor to popular open-source projects
              and a maintainer of React Native components, Chrome extensions,
              and VSCode extensions actively used by the community.
              <br />
              <br />I also have experience in native Android and iOS development
              (e.g., widget creation), third-party integrations, and performance
              optimization.
            </p>

            {/* Link */}
            {/* <Link
              href="#"
              className="mb-6 flex items-center gap-2.5 text-center text-sm font-bold uppercase md:mb-10 lg:mb-12"
            >
              <p>All Achievements</p>
              <img
                src="https://assets.website-files.com/6458c625291a94a195e6cf3a/64b1465d46adaf3f26099edf_arrow.svg"
                alt=""
                className="inline-block"
              />
            </Link> */}
          </div>
          <div>
            {/* projects */}
            <h2 className="text-2xl font-bold md:text-2xl mt-8">
              Other Projects
            </h2>
            <div className="mb-4 h-px w-full bg-black" />
            <div className="mb-6 flex flex-col gap-2 text-sm text-gray-500 sm:text-base lg:mb-8">
              <p>
                <Link
                  href={
                    "https://github.com/mrpmohiburrahman/notionkeys-for-markdown"
                  }
                >
                  <strong>NotionKeys for Markdown: </strong>
                </Link>
                [ VS Code Extension ]
              </p>
              <p>
                <Link
                  href={
                    "https://chromewebstore.google.com/detail/similar-react-native-libr/pnmdlpajhacfhnfhonedgbiempafafbn"
                  }
                >
                  <strong>Similar React Native Libraries: </strong>
                </Link>
                [ Chrome Extension ]
              </p>
              <p>
                <strong>react-native-squish-button: </strong>
                <Link
                  href={
                    "https://github.com/mrpmohiburrahman/react-native-squish-button"
                  }
                >
                  [ React Native Component ]
                </Link>
              </p>
              <p>
                <Link
                  href={
                    "https://github.com/mrpmohiburrahman/react-native-squish-button"
                  }
                >
                  <strong>react-native-cone-slider: </strong>
                </Link>
                [ React Native Component ]
              </p>
            </div>
            {/*Hire me*/}
            <div className="flex flex-col gap-4 font-semibold sm:flex-row">
              <Link
                href="#"
                className="flex items-center gap-4 rounded-md bg-black px-6 py-3 text-white"
              >
                <Mail />
                <p>Hire Me</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
