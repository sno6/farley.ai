import CausalScene, { Scenes } from "../../components/causalscene";

export default function Causal() {
  return (
    <div>
      <p>
        I recently came across an elegant CRDT design that is useful for text
        collaboration applications that I just had to write about. What follows
        is an exploration of Causal Trees and an introduction (or refresher) to
        several important distributed systems concepts.
      </p>

      <p>
        CRDTs are a family of algorithms and datastructures that provide
        eventual consistency guarantees by following some simple mathematical
        properties. As their popularity has increased over the last decade, so
        too has their usage. CRDTS are commonly found in collaborative
        applications, where concurrent updates can be frequent, but they’re also
        used quite extensively in local network and peer-to-peer environments,
        due to the algorithms not requiring a central authority to reconcile
        inconsistencies. That last sentence is quite important, because it means
        that we can get distributed eventual consistency (things eventually
        converge to a consistent value among nodes) without complicated
        processes such as consensus. Don’t fret if you’re a fan of central
        authority though, <a href="https://www.figma.com">Figma</a> successfully
        uses CRDTs server-side to handle the collaborative aspects of their
        product, as well as{" "}
        <a href="https://github.com/soundcloud/roshi">Soundcloud</a> and many
        others.
      </p>

      <p>
        The CRDT I will be describing today is the Causal Tree (roughly as{" "}
        <a href="https://web.archive.org/web/20190505005829/http://www.st.ewi.tudelft.nl/victor/articles/ctre.pdf">
          described
        </a>{" "}
        by Victor Grishchenko). Which we will look at in the context of a simple
        text collaboration application. But before we get too far ahead of
        ourselves, have a play with the example below and see if you can get an
        intuitive sense of how the algorithm operates. Some things to keep an
        eye out for are the ids associated with each node (on hover), and also
        what happens when individual characters are deleted.
      </p>

      <div style={{ height: 20 }}></div>

      <h3>Example 1</h3>

      <CausalScene scene={Scenes.TwoClient} />

      <div style={{ height: 20 }}></div>

      <p>
        {`Each client in the above example has their own local causal tree, the compiled value of which you can see written to their respective text inputs. The implementation we will be discussing is known as a state-based CRDT, or CvRDT, which means that we send the whole tree over the wire to clients instead of just the individual operations as they occur. As a client types, new nodes are added to their tree and sent over to peers who are interested in seeing their updates, when a client receives another client’s tree (which may or may not have new nodes) they merge with their own tree in a way that guarantees a consistent result. One way to think of merge is like a set join, if client 1 has the values {a, b, c} and client 2 has {d}, merging the clients in either order will always result in the same value. But before we go deeper on the merge operation let’s take a step back and see how the tree is structured.`}
      </p>

      <h2>Tree structure</h2>

      <p>
        In our toy example above, each node represents an individual character.
        You may have noticed that each node’s parent is the letter that directly
        precedes that node (this isn’t always the case). This ordering is one
        half of the equation that allows us to position nodes consistently. Take
        for example an alternative structure where each character has an array
        index position instead.
      </p>

      <p style={{ fontSize: 30 }}>
        h<span style={{ color: "#BCCCFF" }}>⁰ </span>e
        <span style={{ color: "#BCCCFF" }}>¹ </span>l
        <span style={{ color: "#BCCCFF" }}>² </span>l
        <span style={{ color: "#BCCCFF" }}>³ </span>o
        <span style={{ color: "#BCCCFF" }}>⁴ </span>
      </p>

      <p>
        Now imagine that you went on to add an exclamation mark at the end of
        the string, but concurrently with that operation you merged changes from
        another client that added the string “Welcome and “ before “hello”.
        You’re now left with “Welco!me and hello”, which was not your original
        intention. Now, you _could_ bake in some logic to your application that
        adjusts your old index to account for the new changes, shifting the
        index of each character in “hello” by the amount of characters that were
        inserted, but that’s not the elegant algorithm that I promised. That’s
        something else known as{" "}
        <a href="https://en.wikipedia.org/wiki/Operational_transformation">
          Operational Transformation (OT)
        </a>{" "}
        that folks that like to complicate simple things use (Google Docs uses
        OT heavily).
      </p>

      <p>
        The much simpler approach taken in causal trees is to simply associate a
        node with the node preceding it. If we do that, it doesn’t matter if the
        underlying tree changes, it still preserves our original intention. In
        essence we’re trading an absolute positioning approach for a relative
        one.
      </p>

      <p>
        But how can individual nodes reference each other? If you hover over any
        of the nodes below you will notice that they have two identifiers, one
        timestamp and one entity id. A timestamp is a monotonically increasing
        integer value that gets incremented each time a node is added to a tree.
        Because wall clocks in distributed systems are unreliable to be used to
        order operations, we use this method combined with the entity id when
        necessary to create what’s called a total order of the nodes in our
        tree. Those familiar with{" "}
        <a href="https://en.wikipedia.org/wiki/Lamport_timestamp">
          Lamport timestamps
        </a>{" "}
        will recognise this approach. If a tree is isolated from any other trees
        and you type a sequence of characters, you will produce a tree similar
        to a linked list, with each node’s timestamp being 1 higher than its
        parent. If we get sent another client’s tree that we notice has nodes
        with higher timestamps we merge those nodes into ours by attaching them
        to their parents, that will either exist in our tree or be introduced by
        theirs. We then simply update our local tree’s timestamp to be the max
        of our current timestamp and the tree’s timestamp that we are merging
        with. Intuitively, this means that when we start adding nodes after the
        merge, the id represents how much context, or amount of nodes we have
        seen before making the decision to add that node, in other words, what
        ‘caused’ the new node.
      </p>

      <p>
        Hover over the nodes in the example below and see if you can figure out
        what the final value will be, based on the ids alone. Click “Reveal” if
        you get stuck.
      </p>

      <div style={{ height: 20 }}></div>

      <h3>Example 2</h3>

      <CausalScene scene={Scenes.IDDemo} />

      <p>
        What's illustrated here is that higher timestamps represent operations
        that happened with more context, or at a later point in the document's
        history, and as such they are traversed first when building the final
        value.
      </p>
      <p>
        So what did the user type and in what order to create the tree above?
      </p>
      <ul>
        <li>They first typed “Causatrees”</li>
        <li>
          Realising they misspelled the word they added an "l " after "Causa"
        </li>
      </ul>

      <p>
        Notice how there are two branches after the 6th node? it makes sense we
        first traverse the branch with the higher timestamp because it was added
        after the misspelling had occurred. But there's a few more cases we need
        to be aware of.
      </p>

      <h2>Traversal</h2>

      <p>
        Which brings us to an important topic, tree traversal and sibling trees.
        To produce the correct final value we need to traverse the tree in
        depth-first pre-order, but with special cases for sibling branches.
        Those special cases are:
      </p>
      <ul>
        <li>
          If a node has multiple children (sibling branches) traverse the
          branches ordered by timestamp descending order. We saw this in the
          previous example.
        </li>
        <li>
          If branches have the same timestamp, traverse the branch that has the
          higher entity id first. What you order by here isn’t important but it
          is critical that we order in a way that is consistent. Ordering by
          entity id is just an example of that.
        </li>
      </ul>

      <p>
        I said at the start of the article that causal trees can be used in
        collaborative, networked environments, which means that it needs to
        handle concurrent updates, duplicate writes, partitioning between
        clients and all of the stuff we love to think about when it comes to
        distributed system design. So how does it do that?
      </p>

      <p>
        When some tree (a) merges with another tree (b), the merge operation is
        essentially a diff and patch. What that means is we find all of the
        nodes from tree ‘a’ that aren’t in ‘b’ and add them to ‘a’. This
        operation is idempotent, which means we can perform it any number of
        times and the result will be the same, like inserting a new value to a
        set. Two other properties that are required for a CvRDT are
        commutativity and associativity. Commutativity ensures that the order of
        merging does not affect the final result, for instance, merging tree 'a'
        with 'b' yields the same result as merging 'b' with 'a'. Associativity
        allows for grouping merge operations in any order, so combining 'a' with
        'b', and then with 'c', gives the same result as merging 'a' with the
        result of merging 'b' with 'c'. When each tree (or node) in a
        distributed system observes the same set of changes, even if in
        different orders, they will eventually converge to the same consistent
        state due to these properties. Let’s look at an example.
      </p>

      <p>{`In the example below we have three clients, the first of which has written “I <3” and then gone offline. Concurrently, after receiving the first client’s changes, client 2 and 3 type “ Pears” and “ Apples” respectively. We can see these concurrent changes represented by the sibling trees after the heart. Instead of having both changes interleaved to produce a jumbled concoction of applepear letter-soup, client 1 (and all clients after merging) is left with text that represents both changes. The ids at the sibling branch/fork are the same, which, again, shows what context each client had available to them when they made their change.`}</p>

      <div style={{ height: 20 }}></div>

      <h3>Example 3</h3>

      <CausalScene scene={Scenes.ThreeClient} />

      <p>
        This demonstration showcases how causal trees can resolve concurrent
        updates in a consistent manner. Whether you would want to do that
        instead of showing conflicts to the user for them to resolve themselves
        is up to the application.
      </p>

      <h2>Deletion</h2>

      <p>
        You may have noticed by now that if you delete a node, the value of that
        node changes to a 🪦. When a node is deleted we need to keep it around
        for consistency reasons, but the value is ignored when we create the
        final value from traversing the tree. This is a common technique found
        in distributed database design and CRDT designs known as tombstoning.
        I’ll leave it as an exercise to the reader to try to understand how
        consistency would be impacted if we removed the node completely from the
        tree on deletion.
      </p>

      <h2>Conclusion</h2>

      <p>
        And that’s a wrap! hopefully you’ve learnt something new about CRDTs! If
        you’re wondering about real-world implementations you will be happy to
        know that the ideas we talked about today are integral to the design of
        such popular general purpose CRDT libraries as{" "}
        <a href="https://github.com/automerge/automerge">Automerge</a> and{" "}
        <a href="https://github.com/yjs/yjs">Yjs</a>.
      </p>
      <p>
        If you’re curious about tree size implications, optimizations, and
        things like node garbage collection, then please check the further
        reading list below, there’s some gems in there I think you will enjoy.
      </p>

      <h2>Further reading</h2>

      <ul>
        <li>
          <a href="https://josephg.com/blog/crdts-go-brrr/">
            CRDTs go brr (optimization exploration).
          </a>
        </li>
        <li>
          <a href="https://web.archive.org/web/20190505005829/http://www.st.ewi.tudelft.nl/victor/articles/ctre.pdf">
            The original Causal Tree paper.
          </a>
        </li>
        <li>
          <a href="http://archagon.net/blog/2018/03/24/data-laced-with-history/">
            Data laced with history (exploration of causal trees and
            optimizations).
          </a>
        </li>
        <li>
          <a href="https://github.com/sno6/causal/blob/main/simpletree/simpletree.go">
            Educational Go implementation that I wrote.
          </a>
        </li>
      </ul>

      <h2>Thanks</h2>

      <p>
        Thanks to the folks at <a href="https://reactflow.dev/">React Flow</a>{" "}
        for letting me use a free Pro account to build the interactive demos.
      </p>

      <h2>Join the convo</h2>

      <a href="https://news.ycombinator.com/item?id=38661580">Hackernews.</a>
    </div>
  );
}
