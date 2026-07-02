import Layout from "../../components/layout";
import { getAllPostIds, getPostData } from "../../lib/posts";
import Head from "next/head";
import Date from "../../components/date";
import utilStyles from "../../styles/utils.module.css";
import { GetStaticProps, GetStaticPaths } from "next";
import Causal from "../custom/causal";

export default function Post({
  postData,
}: {
  postData: {
    title: string;
    date: string;
    readingMins: number;
    contentHtml: string;
  };
}) {
  const getPost = () => {
    if (postData.title === "Causal Trees") {
      return (
        <div className={utilStyles.blogText}>
          <Causal />
        </div>
      );
    }

    return (
      <div
        className={utilStyles.blogText}
        dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
      />
    );
  };

  return (
    <Layout>
      <Head>
        <title>{postData.title}</title>
      </Head>
      <article>
        <h1 className={utilStyles.headingXl}>{postData.title}</h1>
        <small className={utilStyles.lightText}>
          <Date dateString={postData.date} />
          <span> · </span>
          <span className={utilStyles.smallText}>
            {postData.readingMins} min
          </span>
        </small>
        {getPost()}
      </article>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getAllPostIds();
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const postData = await getPostData(params.id as string);
  return {
    props: {
      postData,
    },
  };
};
