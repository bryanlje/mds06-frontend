import { Link } from 'react-router-dom';
import bryanphoto from './assets/bryan.png'
import phuaphoto from './assets/phua.png'
import thomasphoto from './assets/thomas.png'
import shuhuiphoto from './assets/shuhui.png'
import chuaphoto from './assets/chua logo.png'
import snsphoto from './assets/sns logo.png'

export default function About(): JSX.Element {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header - Same as HomePage */}
      <header className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239C92AC' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        
        {/* Navigation Container */}
        <nav className="relative z-10 max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-center">
            {/* Navigation Links - Centered */}
            <div className="flex items-center space-x-12">
              <Link 
                to="/" 
                className="relative text-lg font-medium text-purple-100 group transition-all duration-300 hover:text-white no-underline"
                style={{ textDecoration: 'none', color: '#e9d5ff' }}
              >
                Home
                <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
              </Link>
              <Link 
                to="/about" 
                className="relative text-lg font-medium text-white group transition-all duration-300 hover:text-purple-200 no-underline"
                style={{ textDecoration: 'none', color: 'white' }}
              >
                About
                <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 transform scale-x-100 transition-transform duration-300 group-hover:scale-x-110"></span>
              </Link>
              <Link 
                to="/main" 
                className="relative text-lg font-medium text-purple-100 group transition-all duration-300 hover:text-white no-underline"
                style={{ textDecoration: 'none', color: '#e9d5ff' }}
              >
                Main
                <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 to-blue-400 transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
              </Link>

            </div>
          </div>
        </nav>

        {/* Bottom Border Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent"></div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-gradient-to-br from-gray-50 to-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
              About Our Platform
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-400 to-blue-400 mx-auto mb-8"></div>
            <p className="text-2xl text-blue-600 max-w-2xl mx-auto leading-relaxed">
              Precision. Speed. Insight. 
            </p>
            <p className="text-gray-600 leading-relaxed">
              By combining 1000 fps high-speed cameras with state-of-the-art AI models like SlowFast, we capture and classify the split-second movements that ordinary cameras miss.
            </p>
          </div>

          {/* Content Sections */}
          <div className="space-y-16">
            {/* Our Story Section */}
            <section className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Our Story</h2>
              </div>
                <p className="font-semibold text-gray-800 leading-relaxed">
                  It all started with a simple question — <span className="italic">how much of an athlete’s performance do we actually miss?</span>
                  <br />
                  <br />
                  During training, even the most experienced coaches struggled to capture moments that happened in the blink of an eye, 
                  the flick of a wrist, the angle of a racket, or a split-second foot pivot that could decide the outcome of a rally.
                </p>

                <br />

                <p className="font-semibold text-gray-800 leading-relaxed">
                  That question became the spark for <span className="text-blue-700">Team MDS06</span>:
                  Bryan Leong, Phua Yee Yen, Lee Jian Jun Thomas, and Ting Shu Hui. 
                  With the support of <span className="text-blue-700">Monash University Malaysia </span> 
                  and guidance from <span className="text-blue-700">Dr. Vishnu Monn</span>, 
                  we set out to capture what traditional cameras could not.
                </p>

                <br />

                <p className="font-semibold text-gray-800 leading-relaxed">
                  Armed with a <span className="italic">Chronos&nbsp;2.1 High-Speed Camera</span> capable of recording 
                  <span className="text-blue-700 font-bold"> 1000&nbsp;frames per second</span>, 
                  we transformed an ordinary badminton court into a high-speed research studio. 
                  Precise amera angles, carefully tuned lighting, and athletes performing rapid-fire strokes - 
                  these recordings became the heart of our dataset, revealing layers of movements invisible to the naked eye.
                </p>

                <br />

                <p className="font-semibold text-gray-800 leading-relaxed">
                  From there, we built deep learning models that could recognise and classify each shot type, 
                  from smashes to drop shots, and everything in between. 
                  What began as curiosity evolved into a tool that helps athletes and coaches 
                  see performance in an entirely new way,  
                  turning every millisecond into meaningful insight.
                </p>

            </section>

            {/* Mission Section */}
            <section className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Our Mission</h2>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                <p className="font-semibold text-gray-800 leading-relaxed"> At <span className="text-blue-700">Team MDS06</span>, our mission is simple yet ambitious — to <span className="italic">make the invisible, visible</span>. We strive to bridge the gap between cutting-edge technology and human performance by capturing and understanding the fastest movements in sports with precision and clarity. </p> 
                <br /> 
                <p className="font-semibold text-gray-800 leading-relaxed"> Through the power of <span className="text-blue-700">high-speed imaging</span> and <span className="text-blue-700">deep learning</span>, we aim to revolutionise athletic analysis: providing athletes, coaches, and analysts with <span className="italic">real-time, data-driven insights</span> that enhance training, optimise performance, and prevent injury. </p>
                 <br /> 
                 <p className="font-semibold text-gray-800 leading-relaxed"> Our vision goes beyond badminton, we seek to set a new benchmark for motion analysis in all high-performance sports, where every frame, every millisecond, and every movement tells a story worth understanding. </p>
              </p>
            </section>

            {/* Use Cases */}
            <section className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Use Cases</h2>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">
              Our system is built to serve athletes and coaches who want smarter, faster, and more meaningful
              ways to understand performance. Below are two core use cases that show how our technology can
              make every second of footage count.
            </p>

            <div className="space-y-8">
              {/* Use Case 1 */}
              <div>
                <h3 className="text-2xl font-bold text-blue-700 mb-2">1. Research My Opponent</h3>
                <p className="font-semibold text-gray-800 leading-relaxed">
                  Before an important match, players often spend hours scrubbing through long YouTube videos.
                  Our platform simplifies this by allowing users to upload or link match footage of their
                  opponents. Using <span className="text-blue-700">deep learning</span> and{" "}
                  <span className="text-blue-700">action recognition</span>, the system automatically detects
                  shot types, summarizing key strengths, weaknesses, and
                  play patterns.
                </p>
                <br />
                <p className="font-semibold text-gray-800 leading-relaxed">
                  In minutes, players can identify how their opponents attack, defend, and react under
                  pressure, turning hours of analysis into actionable match strategies.
                </p>
              </div>

              {/* Use Case 2 */}
              <div>
                <h3 className="text-2xl font-bold text-blue-700 mb-2">2. Review My Own Practice Footage</h3>
                <p className="font-semibold text-gray-800 leading-relaxed">
                  For athletes striving to perfect their technique, our system acts as a personal performance
                  analyst. Upload high-speed training footage and let our models classify each stroke, from
                  smashes to drop shots, while tracking motion, timing, and body alignment.
                </p>
                <br />
                <p className="font-semibold text-gray-800 leading-relaxed">
                  The platform highlights inconsistencies, measures stroke accuracy, and provides
                  data-driven feedback. Players can visualize progress over time, spot areas for improvement,
                  and fine-tune their form with precision normally reserved for elite-level analysis.
                </p>
              </div>
            </div>
          </section>


            {/* Special thanks section */}
            <section className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Special thanks to</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                
                <div className="text-center p-4">
                  <div className="w-30 h-30 flex items-center justify-center overflow-hidden mx-auto mb-4">
                    <img 
                        src={snsphoto} 
                        alt="sns"
                        className="w-24 h-24 object-contain"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">SNS Network (M) Sdn Bhd</h3>
                  <p className="text-sm text-gray-600">for providing temporary access to 1x Nvidia H100 GPU</p>
                </div>

                <div className="text-center p-4">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                    <img 
                        src={chuaphoto} 
                        alt="chua"
                        className="w-24 h-24 object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">The Chua Family</h3>
                  <p className="text-sm text-gray-600">for providing an outdoor badminton court and a volunteer player to film footage.</p>
                </div>

              </div>
            </section>

            {/* Team Section */}
            <section className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800">Our Team</h2>
              </div>
            
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    <img 
                        src={bryanphoto} 
                        alt="bryan"
                        className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-800">Bryan Leong</h3>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    <img 
                        src={phuaphoto} 
                        alt="phua"
                        className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-800">Phua Yee Yen</h3>
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    <img 
                        src={thomasphoto} 
                        alt="thomas"
                        className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-800">Thomas Lee</h3>                 
                </div>
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
                    <img 
                        src={shuhuiphoto} 
                        alt="shuhui"
                        className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-800">Ting Shu Hui</h3>           
                </div>
              </div>
            </section>

          
          </div>
        </div>
      </main>
    </div>
  );
}