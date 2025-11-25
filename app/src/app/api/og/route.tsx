import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // ?title=<title>
    const hasTitle = searchParams.has('title');
    const title = hasTitle
      ? searchParams.get('title')?.slice(0, 100)
      : 'DareBet Challenge';

    // ?description=<description>
    const hasDescription = searchParams.has('description');
    const description = hasDescription
      ? searchParams.get('description')?.slice(0, 200)
      : 'Will they do it? Place your bet now!';

    // ?amount=<amount>
    const hasAmount = searchParams.has('amount');
    const amount = hasAmount ? searchParams.get('amount') : '0.05';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a', // anarchist-black
            border: '20px solid #ff0000', // anarchist-red
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <div
              style={{
                color: '#ff0000', // anarchist-red
                fontSize: 30,
                fontWeight: 'bold',
                marginBottom: 20,
                textTransform: 'uppercase',
                letterSpacing: '4px',
              }}
            >
              DAREBET CHALLENGE
            </div>
            
            <div
              style={{
                color: '#ffffff',
                fontSize: 60,
                fontWeight: 'bold',
                marginBottom: 30,
                lineHeight: 1.2,
                textTransform: 'uppercase',
                maxWidth: '90%',
                wordWrap: 'break-word',
              }}
            >
              {title}
            </div>

            <div
              style={{
                color: '#cccccc',
                fontSize: 30,
                marginBottom: 40,
                maxWidth: '80%',
                lineHeight: 1.4,
              }}
            >
              {description}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ff0000',
                color: '#000000',
                padding: '15px 40px',
                fontSize: 30,
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              MIN BET: {amount} SOL
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
