import './styles.css'
import * as ui from './ui.js'

const spdefs = [
  {
    id: 'discourse',
    name: 'Discourse',
    instructions: 'Log in to the Discourse instance and add the proof to your About me.',
    claim: 'INPUT_URL',
    inputs: [
      { id: 'url', name: 'Profile URL', placeholder: 'https://domain.tld/...' }
    ]
  },
  {
    id: 'dns',
    name: 'DNS',
    instructions: 'Add a TXT record to the DNS records of the (sub)domain you want to verify. Set the value of the record to the proof. No specific TTL value is required.',
    claim: 'dns:INPUT_DOMAIN?type=TXT',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' }
    ]
  },
  {
    id: 'forem',
    name: 'Forem',
    instructions: 'Log in to the Forem instance (such as dev.to) and create a new post containing the proof. Visit the post and use the URL to fill in the information below.',
    claim: 'https://INPUT_DOMAIN/INPUT_USERNAME/INPUT_POST',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' },
      { id: 'post', name: 'Post slug', placeholder: 'my-post-title-123a' }
    ]
  },
  {
    id: 'forgejo',
    name: 'Forgejo',
    instructions: 'Log in the Forgejo instance and click on Create new repository. Set the repository name to forgejo_proof, keyoxide_proof or any other name of your choosing. Set the project description to the proof.',
    claim: 'https://INPUT_DOMAIN/INPUT_USERNAME/INPUT_REPO',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' },
      { id: 'repo', name: 'Repository name', placeholder: 'forgejo_proof' }
    ]
  },
  {
    id: 'friendica',
    name: 'Friendica',
    instructions: 'Log in to your account, add the proof to a new post and publish it. Visit the post and use the URL to fill in the information below.',
    claim: 'https://INPUT_DOMAIN/display/INPUT_POST',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'post', name: 'Post ID', placeholder: '...' }
    ]
  },
  {
    id: 'gitea',
    name: 'Gitea',
    instructions: 'Log in the Gitea instance and click on Create new repository. Set the repository name to gitea_proof, keyoxide_proof or any other name of your choosing. Set the project description to the proof.',
    claim: 'https://INPUT_DOMAIN/INPUT_USERNAME/INPUT_REPO',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' },
      { id: 'repo', name: 'Repository name', placeholder: 'gitea_proof' }
    ]
  },
  {
    id: 'github',
    name: 'Github',
    instructions: 'Log in to github.com and click on New gist. Name the file proof.md and put the proof into it.',
    claim: 'https://gist.github.com/INPUT_USERNAME/INPUT_GIST',
    inputs: [
      { id: 'username', name: 'Username', placeholder: 'alice' },
      { id: 'gist', name: 'Gist ID', placeholder: '...' }
    ]
  },
  {
    id: 'gitlab',
    name: 'Gitlab',
    instructions: 'Log in to the GitLab instance (your profile must be "public", not "private") and click on New project. Set the project name to "Gitlab proof". Set the project slug to "gitlab_proof". Set the project description to the proof.',
    claim: 'https://INPUT_DOMAIN/INPUT_USERNAME/gitlab_proof',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'hackernews',
    name: 'Hackernews',
    instructions: 'Log in to Hackernews, click on your username and add the proof to your About section.',
    claim: 'https://news.ycombinator.com/user?id=INPUT_USERNAME',
    inputs: [
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'irc',
    name: 'IRC',
    instructions: 'Log in to the IRC server with your registered nickname and send the following message: "/msg NickServ SET PROPERTY KEY PROOF" (replace PROOF with the proof).',
    claim: 'irc://INPUT_DOMAIN/INPUT_NICK',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'irc.domain.tld' },
      { id: 'nick', name: 'Nickname', placeholder: 'alice' }
    ]
  },
  {
    id: 'kbin',
    name: 'kbin',
    instructions: 'Log in to your account. Add the proof to your Bio section (under Settings / profile).',
    claim: 'https://INPUT_DOMAIN/u/INPUT_USERNAME',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'keybase',
    name: 'Keybase',
    instructions: 'Log in to Keybase and upload your OpenPGP public key. (Only OpenPGP profiles can prove Keybase accounts for now)',
    claim: 'https://keybase.io/INPUT_USERNAME',
    inputs: [
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'lemmy',
    name: 'Lemmy',
    instructions: 'Log in to your account and click on Settings. Add the proof to your Bio section.',
    claim: 'https://INPUT_DOMAIN/u/INPUT_USERNAME',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' },
      { id: 'repo', name: 'Repository name', placeholder: 'forgejo_proof' }
    ]
  },
  {
    id: 'liberapay',
    name: 'Liberapay',
    instructions: 'Log in to liberapay.com, edit your profile and add the proof to one of the Descriptions.',
    claim: 'https://liberapay.com/INPUT_USERNAME',
    inputs: [
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'lichess',
    name: 'Lichess',
    instructions: 'Log in to lichess.org and add the proof as a link.',
    claim: 'https://lichess.org/@/INPUT_USERNAME',
    inputs: [
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'lobsters',
    name: 'Lobste.rs',
    instructions: 'Log in to Lobste.rs and append the proof to the About section.',
    claim: 'https://lobste.rs/~INPUT_USERNAME',
    inputs: [
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'mastodon',
    name: 'Mastodon',
    instructions: 'Log in to your account and click on Edit profile. Add a new item under Profile metadata with a label of your choosing — OpenPGP, Cryptography or Keyoxide could be a meaningful label. The value should be the proof.',
    claim: 'https://INPUT_DOMAIN/@INPUT_USERNAME',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'matrix',
    name: 'Matrix',
    instructions: 'Log in to your Matrix instance, join the #doipver:matrix.org room and send the proof as a message. Click on View Source for that message, you should now see the value for event_id. The event_id will start with the $ symbol; do not include this symbol in the claim!',
    claim: 'matrix:u/INPUT_USERNAME:INPUT_DOMAIN?org.keyoxide.r=dBfQZxCoGVmSTujfiv%3Amatrix.org&org.keyoxide.e=INPUT_EVENT',
    inputs: [
      { id: 'domain', name: "Your Matrix instance's domain", placeholder: 'domain.tld' },
      { id: 'username', name: 'Your Matrix username', placeholder: 'alice' },
      { id: 'event', name: 'Event ID', placeholder: '...' }
    ]
  },
  {
    id: 'opencollective',
    name: 'OpenCollective',
    instructions: "Log in to OpenCollective and add a proof to the collective's About section at the bottom of the page.",
    claim: 'https://opencollective.com/INPUT_USERNAME',
    inputs: [
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'owncast',
    name: 'Owncast',
    instructions: "Log in to the Owncast's admin page. Under Configuration > General, add a new social link with platform Keyoxide and the URL to your Keyoxide profile page.",
    claim: 'https://INPUT_DOMAIN',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' }
    ]
  },
  {
    id: 'peertube',
    name: 'Peertube',
    instructions: 'Log in to your account and click on My account. Add the proof to your Description section.',
    claim: 'https://INPUT_DOMAIN/a/INPUT_USERNAME',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'pixelfed',
    name: 'Pixelfed',
    instructions: 'Log in to your account and click on Edit profile. Add the proof to your Biography section.',
    claim: 'https://INPUT_DOMAIN/INPUT_USERNAME',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'pleroma',
    name: 'Pleroma',
    instructions: 'Log in to your account and click on Edit profile. Add the proof to your Biography section.',
    claim: 'https://INPUT_DOMAIN/users/INPUT_USERNAME',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  },
  {
    id: 'reddit',
    name: 'Reddit',
    instructions: 'Log in to reddit.com and create a new post containing the proof. Copy the link to the post.',
    claim: 'INPUT_URL',
    inputs: [
      { id: 'url', name: 'Post URL', placeholder: 'https://www.reddit.com/user/USERNAME/comments/POST_ID/POST_TITLE/' }
    ]
  },
  {
    id: 'stackexchange',
    name: 'StackExchange',
    instructions: 'Log in to any of the StackExchange websites, go to Edit profile and add the proof to your About me section. Copy the link to your profile page.',
    claim: 'INPUT_URL',
    inputs: [
      { id: 'url', name: 'Post URL', placeholder: 'https://stackoverflow.com/users/USERID/USERNAME' }
    ]
  },
  {
    id: 'telegram',
    name: 'Telegram',
    instructions: 'Please visit the link below for the instructions.',
    claim: 'https://t.me/INPUT_USERNAME?proof=INPUT_GROUP',
    inputs: [
      { id: 'username', name: 'Username', placeholder: 'alice' },
      { id: 'group', name: 'Group name', placeholder: '...' }
    ]
  },
  {
    id: 'twitter',
    name: 'Twitter',
    instructions: 'Log in to twitter.com and compose a new tweet containing the proof.',
    claim: 'https://twitter.com/INPUT_USERNAME/status/INPUT_TWEET',
    inputs: [
      { id: 'username', name: 'Username', placeholder: 'alice' },
      { id: 'tweet', name: 'Tweet ID', placeholder: '123456789...' }
    ]
  },
  {
    id: 'writefreely',
    name: 'WriteFreely',
    instructions: 'Log in to your account, add the proof to a new post and publish it.',
    claim: 'https://INPUT_DOMAIN/INPUT_USERNAME/INPUT_POST',
    inputs: [
      { id: 'domain', name: 'Domain', placeholder: 'domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' },
      { id: 'post', name: 'Post ID', placeholder: '...' }
    ]
  },
  {
    id: 'xmpp',
    name: 'XMPP',
    instructions: 'Visit https://xmpp-util.keyoxide.org, log in using your XMPP credentials and follow the instructions to add a new proof.',
    claim: 'xmpp:INPUT_USERNAME@INPUT_DOMAIN',
    inputs: [
      { id: 'domain', name: 'XMPP server domain', placeholder: 'xmpp.domain.tld' },
      { id: 'username', name: 'Username', placeholder: 'alice' }
    ]
  }
]

export const addClaimDialogs = async (profile) => {
  let addedHtml = ''

  spdefs.forEach(sp => {
    addedHtml += `
      <dialog id="add_claim_${sp.id}">
        <form method="dialog">
          <button type="button" class="close_dialog">&#215;</button>
          <h3>
            <img src="https://design.keyoxide.org/brands/service-providers/${sp.id}/icon.svg"/>
            ${sp.name}
          </h3>
          <h4>Proof (direct or hashed)</h4>
          <p>${sp.instructions}</p>
          <p>For more detailed instructions, please refer to the <a href="https://docs.keyoxide.org/service-providers/${sp.id}/">Keyoxide documentation</a>.</p>
          <h4>Claim</h4>
    `

    sp.inputs.forEach(input => {
      addedHtml += `
        <p>
          <label for="${input.id}">${input.name}</label>
          <br>
          <input type="text" name="${input.id}" class="${input.id}" placeholder="${input.placeholder}">
        </p>
      `
    })

    addedHtml += `
          <button type="submit">Add</button>
        </form>
      </dialog>
    `
  })

  const div = document.createElement('div')
  div.innerHTML = addedHtml
  document.body.appendChild(div)

  spdefs.forEach(sp => {
    document.querySelector(`#add_claim_${sp.id} form`).addEventListener('submit', evt => {
      const el = document.querySelector(`#add_claim_${sp.id} form`)
      let claim = sp.claim

      sp.inputs.forEach(input => {
        // @ts-ignore
        const inputValue = el.querySelector(`input.${input.id}`).value
        claim = claim.replace(`INPUT_${input.id.toUpperCase()}`, inputValue)
      })

      profile = ui.getProfileFromForm()
      profile.claims.push(claim)
      ui.putProfileToForm(profile)

      // @ts-ignore
      document.querySelector('dialog[open]').close()
    })
  })
}
