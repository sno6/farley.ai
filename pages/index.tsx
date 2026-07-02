import Head from "next/head";
import Layout from "../components/layout";
import utilStyles from "../styles/utils.module.css";
import { getSortedPostsData } from "../lib/posts";
import Link from "next/link";
import Date from "../components/date";
import { GetStaticProps } from "next";

export default function Home({
  allPostsData,
}: {
  allPostsData: {
    id: string;
    date: string;
    title: string;
    readingMins: number;
  }[];
}) {
  return (
    <Layout home>
      <Head>
        <title>Projects and Ramblings</title>
      </Head>
      <section className={`${utilStyles.headingMd} ${utilStyles.padding1px}`}>
        <ul className={utilStyles.list}>
          {allPostsData.map(({ id, date, title, readingMins }) => (
            <li className={utilStyles.listItem} key={id}>
              <Link href={`/posts/${id}`}>
                <div className={utilStyles.listItemTitleContainer}>
                  <a className={utilStyles.listItemTitleText}>
                    <span>{title}</span>
                    <img
                      src="/images/arrow.svg"
                      height={8}
                      width={22}
                      className={utilStyles.arrow}
                    />
                  </a>
                </div>
              </Link>
              <small className={utilStyles.lightText}>
                <div>
                  <Date dateString={date} />
                  <span> · </span>
                  <span className={utilStyles.smallText}>
                    {readingMins} min
                  </span>
                </div>
              </small>
            </li>
          ))}
        </ul>
      </section>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const allPostsData = getSortedPostsData();
  return {
    props: {
      allPostsData,
    },
  };
};
